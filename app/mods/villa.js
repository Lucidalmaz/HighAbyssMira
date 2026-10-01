// =====================================================================  VILLA (Modul „villa“, Fassung 3 · AP-19): Kapitel 4 „Sehen, Bergen, Schweigen“ – Hauptweg UK 1–13
// Quelle: story_final.md Kapitel 4 (Unterkapitel 1–13, Kinosequenz, Fundstücke, Rätsel R4-1…R4-3, Ende), LWO-Dossier 80 §5.5/5.7–5.11, Dossier 84 (K-Akten, Pells Heft).
// Die Halle der Villa baut anwesen.js (ANW_HALL, x −900 | z 900). Dieses Modul baut die übrigen Innenräume als eigene Räume daneben (Überblendung wie
// anwesen_enterHall) – und zwar ERST beim ersten Betreten (Ladezeit): Arbeitszimmer (az), Anrichte mit Dienstboten-/Kellertür (an), Obergeschoss Ost mit Archiv und
// Heinrichs Zimmer (og), Keller mit Kühlraum, Schleuse und Zelle Ost (kr), dazu Vegas' Stube in Nr. 3 (nr3) und den Beobachtungsposten Nr. 9 (nr9).
// Alles hängt an einer Gruppe (VILLA.g), die nur sichtbar ist, solange Luke in einem dieser Räume steht. Lichter: 18 VLights beim Laden mit Intensität 0,
// beim Bau nur umgesetzt (keine Lichter zur Laufzeit); Kühlraum-Röhren nur über die Intensität. Möbel nur aus Scans (game/assets/ms), Papier/Schilder als Decals.
// Kapitelablauf (UK): 1 Straße/Aufräumkommando (AG-11, Z-09, B-K4-01, „Fünf Minuten“) · 2 Nr. 3 Lucy/Speck · 3 AG-12 Auftrag 1 (drei Wege) · 4 Nr. 9 Posten
//   · 5 Presse (anwesen.js) · 6 Halle (anwesen.js: Porträt „L. B.“, Strickjacke, Nachbild, Post Z-07) · 7 Arbeitszimmer R4-1 · 8 Nadel → Archiv, Heinrichs Zimmer
//   · 9 AG-13 Schleichen (Sichtkegel, Atem, Schrank), W-09 · 10 Kühlraum R4-3, Höhepunkt A, Zelle Ost · 11 AG-14 Wolter, W-10 (Höhepunkt B) · 12 W-11 Ring, Noten
//   · 13 Treppe (anwesen_hallEnd) → Kinosequenz k4 → Endkarte.
// Spielstand 'villa' (AP-03): { rooms, kuehl, zaehlbuch, grete, kanne } + uk, f (erledigte Schritte), still (Sekunden ohne Atem im Schrank).
// Tageslicht Kap. 4 (Morgen/Mittag, Nebel): nur Nebel, Himmel, Hemisphären-/Mondintensität und Belichtung – je Bild nach dem Basis-Update gesetzt (wie kino_envTick).
// Testzugriff: window.__villa = { S, V, ev(code), geh(raum), uk() }.
const VILLA = { g: null, gebaut: new Set(), bau: {}, L: [], Lf: 0, raum: null, amb: .3, t: 0, chk: 0, hit: {}, o: {}, crew: false, kombi: false, busy: false,
  tag: { an: false, sv: null }, sperre: false, ag13: null, hp: null, kamT: 0, neon: [], rohr: [], glas: null, atmeEl: null, v: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], q: new THREE.Quaternion(), dummy: new THREE.PerspectiveCamera(), brumm: null };
const VILLA_R = {
  az: { x0: -921, x1: -913, z0: 896, z1: 904, h: 3.4, amb: .42, name: 'Arbeitszimmer' },
  an: { x0: -891, x1: -885, z0: 897, z1: 903, h: 3.2, amb: .36, name: 'Anrichte' },
  og: { x0: -908, x1: -886, z0: 927, z1: 933, h: 3, amb: .36, name: 'Obergeschoss' },
  kr: { x0: -908, x1: -888, z0: 866, z1: 872, h: 3, amb: .012, name: 'Keller' },
  nr3: { x0: -985, x1: -977, z0: 855, z1: 861, h: 2.6, amb: .45, name: 'Nr. 3' },
  nr9: { x0: -985, x1: -975, z0: 895, z1: 901, h: 2.6, amb: .2, name: 'Nr. 9' } };
// Eingänge: [x, z, yaw] (yaw 0 = Blick nach −z, PI/2 = nach −x)
const VILLA_TUER = { az: [-914.2, 898, PI / 2], an: [-889.8, 900, -PI / 2], og: [-896, 928.3, PI], kr: [-906.6, 869, -PI / 2], nr3: [-981, 859.8, 0], nr9: [-983.8, 896.2, PI],
  halleW: [-905.8, 897.6, -PI / 2], halleO: [-894.2, 900, PI / 2], anOben: [-887.6, 901.6, PI / 2], anUnten: [-889.4, 898.3, PI] };
const villa_S = Object.assign(typeof kap_saveDefault === 'function' ? kap_saveDefault('villa') || {} : {}, { uk: 0, f: new Set(), still: 0 });
if (typeof KAP_SAVE !== 'undefined' && KAP_SAVE.villa) Object.assign(villa_S, KAP_SAVE.villa, { f: new Set(), uk: 0 });
MOD_SAVE.push(['villa', () => ({ rooms: [...VILLA.gebaut].filter(k => villa_S.f.has('in_' + k)), kuehl: !!villa_S.kuehl, zaehlbuch: villa_S.zaehlbuch ?? null, grete: !!villa_S.grete, kanne: !!villa_S.kanne,
  uk: villa_S.uk, f: [...villa_S.f], still: villa_S.still }),
  v => { if (!v || typeof v !== 'object') return; villa_S.rooms = v.rooms || []; villa_S.kuehl = !!v.kuehl; villa_S.zaehlbuch = v.zaehlbuch ?? null; villa_S.grete = !!v.grete; villa_S.kanne = !!v.kanne;
    villa_S.uk = +v.uk || 0; villa_S.f = new Set(v.f || []); villa_S.still = +v.still || 0; }]);
const villa_hat = k => villa_S.f.has(k);
const villa_setz = k => { villa_S.f.add(k); };
const villa_kap4 = () => (typeof kap === 'function' ? kap() : curChapter()) === 4;
const villa_item = k => story.items.includes(k);
const villa_in = (R, x, z, m = 0) => x > R.x0 - m && x < R.x1 + m && z > R.z0 - m && z < R.z1 + m;
function villa_raumBei(x, z) { for (const k in VILLA_R) if (villa_in(VILLA_R[k], x, z, .3)) return k; return null; }
function villa_neu() { villa_S.f.clear(); villa_S.uk = 1; villa_S.still = 0; villa_S.kuehl = false; villa_S.zaehlbuch = null; villa_S.grete = false; villa_S.kanne = false; }
function villa_uk(n) { if (n > villa_S.uk) villa_S.uk = n; villa_ziel(); }
function villa_ziel() { if (!villa_kap4() || typeof setC3 !== 'function') return; const A = typeof anwesen_S !== 'undefined' ? anwesen_S : {}, c = typeof anwesen_count === 'function' ? anwesen_count() : 8;
  let t;
  if (A.hallDone) return;
  if (villa_hat('noten')) t = 'Die Treppe in der Halle.';
  else if (villa_hat('ring')) t = 'Whiskey pickt am Porträt.';
  else if (villa_hat('ag14')) t = 'Das Arbeitszimmer. Jemand hat „Kum!“ gerufen.';
  else if (villa_hat('zelle')) t = 'Zurück nach oben. In die Halle.';
  else if (villa_hat('ag13')) t = 'Die Kellertür in der Anrichte. Zelle Ost. Kühlraum.';
  else if (villa_hat('nadel')) t = 'Die Dienstbotentreppe in der Anrichte. Das Archiv.';
  else if (A.open) t = 'Die Villa Seiler. Sieh dich um.';
  else if (A.key) t = 'Die Villa Seiler. Schließ die Tür auf.';
  else if (villa_hat('ag12')) t = c === 8 ? 'Die Villa Seiler. Die Presse im Garten fügt die acht Teile zusammen.' : `Die Villa Seiler. Acht Schlösser. Dir fehlen noch ${8 - c} Teile – frag den Raben.`;
  else if (villa_hat('ag12_lauf')) t = 'Vor der Tür stehen zwei Männer in grauen Mänteln.';
  else if (villa_hat('lucy')) t = 'Lucy lebt. Fast ganz. Bleib noch einen Moment.';
  else t = 'Nr. 3. Vegas. Lucy liegt bei ihm auf dem Sofa.';
  setC3(t); }

// ---------------------------------------------------------------- Hilfen
function villa_sperre(on) { VILLA.sperre = !!on; setScripted(on ? dt => { villa_heil(dt); return true; } : null); }
// Schutz: ein nicht endlicher Wert im Kamera-/Spielerzustand legt sonst die Hauptschleife lahm (AudioParam non-finite); läuft vor der Kamera (scripted) und im Takt
function villa_heil(dt) { if (isFinite(player.bob) && isFinite(camY) && isFinite(player.pitch) && isFinite(player.yaw) && isFinite(vel.x + vel.y + vel.z) && isFinite(player.pos.x + player.pos.y + player.pos.z)) return;
  if (!VILLA.nanLog2) { VILLA.nanLog2 = 1; console.warn('Villa: Kamera-Zustand repariert', 'bob', player.bob, 'camY', camY, 'pitch', player.pitch, 'yaw', player.yaw, 'vel', vel.x, vel.z, 'pos', player.pos.x, player.pos.y, 'dt', dt, 'kiffenZeit', typeof kiffen_S !== 'undefined' ? kiffen_S.zeit : '-'); }
  if (!isFinite(player.bob)) player.bob = 0; if (!isFinite(camY)) camY = 1.65; if (!isFinite(player.pitch)) player.pitch = 0; if (!isFinite(player.yaw)) player.yaw = 0; if (!isFinite(vel.x + vel.y + vel.z)) vel.set(0, 0, 0);
  if (!isFinite(player.pos.x + player.pos.y + player.pos.z) && VILLA.raum) { const p = VILLA_TUER[VILLA.raum]; if (p) player.pos.set(p[0], 0, p[1]); } }
// Gesprächssperre mit Zähler: verschachtelte/überlappende Abläufe setzen state.talking nie „hängend“ zurück
function villa_rede(an) { if (an) { if (!VILLA.redeN) VILLA.redeSv = state.talking; VILLA.redeN = (VILLA.redeN || 0) + 1; state.talking = true; } else { VILLA.redeN = Math.max(0, (VILLA.redeN || 0) - 1); if (!VILLA.redeN) state.talking = false; } }
async function villa_says(lines) { villa_rede(true); try { await say(lines); } finally { villa_rede(false); } }
const villa_hand = s => '<span class="hand">' + s + '</span>';
const villa_masch = s => '<span style="font-family:\'Courier New\',monospace;font-size:.92em;letter-spacing:.02em">' + s + '</span>';
const villa_blei = s => '<span class="hand" style="color:#4a4a4a">' + s + '</span>';
const VILLA_SIG = '<span style="letter-spacing:.34em;margin-left:.2em">∴</span>';
function villa_mat(key, tint, tile) { const m = msSurfMat(key, { tint }); m.userData.tile = tile || 1.2; return m; }
function villa_licht(x, y, z, farbe, i, d = 7) { const L = VILLA.L[VILLA.Lf++]; if (!L) return null; L.position.set(x, y, z); L.color.setHex(farbe); L.intensity = i; L.distance = d; L.userData.i0 = i; return L; }
function villa_box(w, h, d, x, y, z, mat, o = {}) { return box(w, h, d, x, y, z, mat, Object.assign({ parent: VILLA.g }, o)); }
function villa_hit(w, h, d, x, y, z, label, act) { const m = box(w, h, d, x, y, z, hidden, { cast: false, parent: VILLA.g }); m.userData.noCol = true; interact(m, label, act); return m; }
function villa_wand(axis, fixed, a, b, H, mat, gaps = [], t = .2) { const lintel = Math.min(2.2, H - .3), s = [...gaps].sort((p, q) => p.at - q.at); let cur = a;
  const seg = (s0, e, h, yb, col) => { if (e - s0 < .01 || h < .01) return; const len = e - s0, mid = (s0 + e) / 2;
    if (axis === 'x') villa_box(len, h, t, mid, yb + h / 2, fixed, mat, { collide: col }); else villa_box(t, h, len, fixed, yb + h / 2, mid, mat, { collide: col }); };
  for (const gp of s) { seg(cur, gp.at - gp.w / 2, H, 0, true); seg(gp.at - gp.w / 2, gp.at + gp.w / 2, H - lintel, lintel, false); cur = gp.at + gp.w / 2; }
  seg(cur, b, H, 0, true); }
function villa_raum(R, wand, boden, decke) { const w = R.x1 - R.x0, d = R.z1 - R.z0, cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2;
  plane(w, d, cx, .01, cz, boden, -PI / 2, 0, VILLA.g); villa_box(w + .4, .2, d + .4, cx, R.h + .1, cz, decke, { cast: false });
  villa_wand('x', R.z0, R.x0, R.x1, R.h, wand); villa_wand('x', R.z1, R.x0, R.x1, R.h, wand); villa_wand('z', R.x0, R.z0, R.z1, R.h, wand); villa_wand('z', R.x1, R.z0, R.z1, R.h, wand);
  indoorRects.push({ x0: R.x0, x1: R.x1, zb: R.z0, zf: R.z1, y: 0 }); }
// Scan-Modell in die Gruppe: size/axis wie msFit, y = Unterkante
async function villa_put(key, file, size, axis, x, z, ry, y = 0) { try { const m = await msModel(key, file); const o = msGround(msFit(m.clone(true), size, axis)); o.position.set(x, y, z); o.rotation.y = ry;
  o.traverse(q => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); VILLA.g.add(o); return o; } catch (e) { console.warn('Villa ' + key, e); return null; } }
async function villa_fbx(key, spec, size, axis, x, z, ry, y = 0, sc = null) { try { const m = await msFBX(key, 'model.fbx', spec); if (sc) m.scale.set(...sc); else msFit(m, size, axis); const o = msGround(m); o.position.set(x, y, z); o.rotation.y = ry;
  o.traverse(q => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); VILLA.g.add(o); return o; } catch (e) { console.warn('Villa ' + key, e); return null; } }
const VILLA_SPEC = {
  chair: { chair: { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg', color: 0x8a8078 } },
  sofa: { Sofa: { b: 'Sofa_BaseColor.jpg', n: 'Sofa_Normal.jpg', r: 'Sofa_Roughness.jpg', color: 0x7a6a62 } },
  bed: { blanket: { b: 'blanket_color.jpg', n: 'blanket_nrm.jpg', r: 'blanket_rough.jpg', ds: 1, color: 0x8a8278 }, mattress: { b: 'mattress_color.jpg', n: 'mattress_nrm.jpg', r: 'mattresss_rough.jpg', color: 0xa8a094 }, bed: { b: 'bed_color.jpg', n: 'bed_nrm.jpg', r: 'bed_Rough.jpg', m: 'bed_metalic.jpg' } } };
{ const W_ = k => ({ b: `T_${k}_BaseColor.jpg`, n: `T_${k}_Normal.jpg`, r: `T_${k}_Roughness.jpg`, color: 0x7a6e60 });
  VILLA_SPEC.hutch = { 'Wood-1': W_('Wood-1'), 'Wood-2': W_('Wood-2'), 'Wood-3': W_('Wood-3'), Metal: { b: 'T_Metal_BaseColor.jpg', n: 'T_Metal_Normal.jpg', r: 'T_Metal_Roughness.jpg', m: 'T_Metal_Metallic.jpg' } }; }
// Papier/Schild als Decal (Canvas), optional mit Interaktion
function villa_cv(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; }
function villa_decal(cv, w, h, x, y, z, rx = 0, ry = 0, o = {}) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex(cv, true), transparent: !!o.alpha, alphaTest: o.alpha ? .05 : 0, roughness: o.rough ?? .92, metalness: o.metal || 0,
  side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, emissive: o.glow ? 0xffffff : 0x000000, emissiveMap: o.glow ? tex(cv, true) : null, emissiveIntensity: o.glow || 0 }));
  m.position.set(x, y, z); m.rotation.set(rx, ry, 0, 'YXZ'); m.userData.noCol = true; m.receiveShadow = true; VILLA.g.add(m); return m; }
function villa_papierCv(zeilen, o = {}) { return villa_cv(o.w || 256, o.h || 340, (c, w, h) => { c.fillStyle = o.grund || '#e6ddc6'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(90,70,40,${Math.random() * .05})`; c.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 12, 1 + Math.random() * 3); }
  c.fillStyle = o.tinte || '#26241f'; c.font = o.font || '15px "Courier New", monospace'; let y = o.y0 || 34; for (const z of zeilen) { c.fillText(z, 16, y); y += o.lh || 20; }
  if (o.auge && typeof akte_auge === 'function') try { akte_auge(c, w - 34, 30, 12, '#3a3a3a'); } catch (e) {}
  if (o.fuss) { c.font = '9px "Courier New", monospace'; c.fillStyle = '#5a564c'; c.fillText(o.fuss, 16, h - 12); } }); }
function villa_zettel(zeilen, w, h, x, y, z, rx, ry, o = {}) { return villa_decal(villa_papierCv(zeilen, o), w, h, x, y, z, rx, ry); }
function villa_note(titel, html, key, danach) { openNote(titel, html, key, danach); }
function villa_beob(id, o) { try { if (typeof beobachter_zettel === 'function') return beobachter_zettel(id, o); } catch (e) { console.warn('Villa Beobachter', id, e); } return false; }
function villa_spur(art, o) { try { if (typeof beob_spur === 'function') return beob_spur(art, o); } catch (e) {} return null; }
function villa_trust(k) { try { if (typeof lwo_ereignis === 'function') return lwo_ereignis(k); } catch (e) {} return false; }
function villa_kratzen(x, y, z) { try { for (let i = 0; i < 3; i++) Audio.play('scrape3', { gain: .22, rate: 1.9 + i * .1, dur: .22, delay: i * .34, x, y, z, ref: 2 }); } catch (e) {} }
function villa_gedanke(id, t, d = 600) { if (typeof gedanke === 'function') gedanke(id, t, d, 3); else subtitle(t, 3800, 'LUKE'); }

// ---------------------------------------------------------------- Raumwechsel (Überblendung) – baut den Raum beim ersten Betreten
async function villa_geh(ziel, o = {}) {
  if (VILLA.busy) return; VILLA.busy = true; villa_rede(true);
  try { if (o.ton !== false) { try { Audio.creak(.25); } catch (e) {} }
    await fade(1, o.ms || 900);
    const k = ziel.split(':')[0]; if (VILLA_R[k]) await villa_bauen(k);
    const p = o.p || VILLA_TUER[ziel] || VILLA_TUER[k]; if (p) { player.pos.set(p[0], 0, p[1]); player.yaw = p[2]; player.pitch = 0; vel.set(0, 0, 0); camY = 1.65; }
    if (typeof anwesen_S !== 'undefined') anwesen_S.inHall = k === 'halle';
    if (typeof PERF_CULL !== 'undefined') PERF_CULL.t = 0; VILLA.raum = VILLA_R[k] ? k : null; villa_sichtbar();
    if (VILLA.raum) villa_setz('in_' + k);
    if (o.vorher) await o.vorher();
    await wait(250); await fade(0, o.ms || 900);
  } catch (e) { console.error('Villa geh', ziel, e); fade(0, 400); } finally { villa_rede(false); VILLA.busy = false; }
  if (o.danach) o.danach(); }
function villa_sichtbar() { const P = player.pos, k = villa_raumBei(P.x, P.z); VILLA.raum = k; if (VILLA.g) VILLA.g.visible = !!k;
  VILLA.amb = k ? VILLA_R[k].amb : .3; }
async function villa_bauen(k) { if (VILLA.gebaut.has(k)) return; if (VILLA.bau[k]) return VILLA.bau[k];
  VILLA.bau[k] = (async () => { const t0 = performance.now(); try { await VILLA_BAU[k](VILLA_R[k]); } catch (e) { console.error('Villa Bau ' + k, e); }
    VILLA.gebaut.add(k); console.log('[Villa] Raum ' + k + ' gebaut in ' + Math.round(performance.now() - t0) + ' ms'); })();
  return VILLA.bau[k]; }

// =====================================================================  RÄUME
const VILLA_BAU = {};
// ---- Vegas' Stube, Nr. 3 (UK 2): Alufolie, Ordner, drei Funkgeräte, Mondlandung mit LÜGE, Mike als Baby; Lucy auf dem Sofa
VILLA_BAU.nr3 = async R => {
  const wp = villa_mat('wallpaper_deco', 0x8a7d66, 1.3), fl = villa_mat('floor_worn', 0x5a4a3a, 1), pl = villa_mat('wall_plaster', 0x77726a, 2);
  villa_raum(R, wp, fl, pl); const cx = -981, T = THREE;
  const tuer = await villa_put('door1', 'model.gltf', 2.1, 'y', cx, R.z1 - .08, PI);
  villa_hit(1.2, 2.2, .4, cx, 1.1, R.z1 - .25, 'Nach draußen', () => villa_nr3Raus());
  // Sofa an der Westwand, Lucy darauf; Sessel gegenüber; Ofen-Ecke; Funkgeräte auf der Kommode; Fernseher
  await villa_fbx('sofa', VILLA_SPEC.sofa, 2.0, 'x', R.x0 + .55, 857.9, PI / 2);
  const ch = async (x, z, ry) => villa_fbx('chair', VILLA_SPEC.chair, .92, 'y', x, z, ry);
  await ch(R.x0 + 2.6, 856.6, -PI / 2 - .4); await ch(R.x1 - 1.3, 859.6, PI + .3);
  const kom = await villa_fbx('dresser', VILLA_SPEC.hutch, 1.25, 'y', R.x1 - .35, 857.2, -PI / 2);
  for (let i = 0; i < 3; i++) await villa_put('w_funk', 'model.glb', .24, 'max', R.x1 - .32, 856.6 + i * .34, -PI / 2 + (i - 1) * .2, kom ? new T.Box3().setFromObject(kom).max.y - .01 : 1.2);
  await villa_put('crt', 'model.glb', .42, 'y', R.x0 + .5, 855.6, PI / 2 + .5, 0);
  await villa_put('radio', 'model.gltf', .42, 'max', R.x1 - .4, 859.4, -PI / 2, .78);
  await villa_put('floorlamp', 'model.gltf', 1.6, 'y', R.x0 + .5, 860.3, .3);
  await villa_put('w_teller', 'model.glb', .24, 'max', R.x1 - 1.3, 859.6, 0, .47);
  await villa_put('w_tasse', 'model.glb', .1, 'max', -983.3, 857.6, 0, .02);
  await villa_put('frame_deco', 'model.gltf', .5, 'y', R.x1 - .06, 858.6, -PI / 2, 1.5);
  // Alufolie an den Fenstern (Südwand), Poster Mondlandung „LÜGE“, Ordnerstapel mit „(hw)“
  const alu = villa_cv(256, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#b8bcc0'); g.addColorStop(.5, '#e8ecef'); g.addColorStop(1, '#9ea3a8'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { c.strokeStyle = `rgba(${Math.random() < .5 ? '60,64,70' : '255,255,255'},.35)`; c.beginPath(); c.moveTo(Math.random() * w, Math.random() * h); c.lineTo(Math.random() * w, Math.random() * h); c.stroke(); } c.fillStyle = 'rgba(180,160,90,.5)'; c.fillRect(0, 0, w, 10); c.fillRect(0, h - 10, w, 10); });
  for (const x of [-983.4, -978.6]) villa_decal(alu, 1.1, 1.2, x, 1.5, R.z0 + .12, 0, 0, { rough: .3, metal: .7 });
  villa_decal(villa_cv(256, 340, (c, w, h) => { c.fillStyle = '#10131a'; c.fillRect(0, 0, w, h); c.fillStyle = '#d8d4c8'; c.beginPath(); c.arc(w * .5, h * .72, 90, PI, 0); c.fill(); c.fillStyle = '#a8a498'; c.fillRect(w * .44, h * .38, 30, 70);
    c.fillStyle = '#e8e4d8'; c.font = 'bold 22px Arial'; c.textAlign = 'center'; c.fillText('APOLLO 11 · 1969', w / 2, 36); c.save(); c.translate(w / 2, h * .5); c.rotate(-.35); c.fillStyle = '#c01818'; c.font = 'bold 74px Arial'; c.fillText('LÜGE', 0, 20); c.restore(); }),
    .62, .82, R.x0 + .12, 1.65, 859.9, 0, PI / 2);
  villa_zettel(['(hw)  (hw)', 'Gasleck 1975 (hw)', 'Umspannwerk?? (hw)', '— rot eingekreist —'], .3, .4, R.x1 - .12, 1.4, 855.9, 0, -PI / 2, { font: '18px Caveat, cursive', tinte: '#8a1a14' });
  villa_licht(-981, 2.3, 858, 0xffc890, 2.0, 8); villa_licht(R.x0 + .6, 1.5, 860.2, 0xffb070, 1.1, 5); villa_licht(R.x1 - .8, 1.8, 856.4, 0xffd8b0, .9, 5);
  // Küchenecke: Schublade mit den Streichhölzern (Tips, „Fünf Minuten“) – kiffen_fund wurde beim Laden auf diese Stelle gesetzt
  // Figuren: Vegas (Schürze) und Lucy auf dem Sofa, weißer Ring in den Augen
  if (typeof figuren_embody === 'function') {
    const gv = new T.Group(); gv.position.set(-979.9, 0, 858.2); gv.rotation.y = PI + .7; VILLA.g.add(gv); VILLA.o.vegas = await figuren_embody(gv, 'vegas', { clip: 'idle2' }); VILLA.o.vegasG = gv;
    const gl = new T.Group(); gl.position.set(R.x0 + .62, 0, 857.6); gl.rotation.y = PI / 2; VILLA.g.add(gl); VILLA.o.lucy = await figuren_embody(gl, 'lucy_erw', { sit: .45 }); VILLA.o.lucyG = gl;
    try { if (VILLA.o.lucy) figuren_lookAt(VILLA.o.lucy, camera, .8); if (VILLA.o.vegas) figuren_lookAt(VILLA.o.vegas, camera, .6); } catch (e) {} }
  villa_hit(1.2, 1.2, 2.2, R.x0 + .7, .6, 857.9, () => villa_hat('lucy') ? 'Lucy' : 'Lucy', () => villa_lucyNochmal());
  villa_hit(.8, 1.9, .8, -979.9, .95, 858.2, 'Vegas', () => villa_vegasNochmal());
  VILLA.o.nr3Tuer = tuer; };
// ---- Beobachtungsposten Nr. 9 (UK 4): Garage mit Werkbank, Wohnzimmer ohne Bewohner, Stativ mit Kamera am Gardinenloch
VILLA_BAU.nr9 = async R => {
  const wp = villa_mat('wallpaper_old', 0x6a6458, 1.4), fl = villa_mat('floor_worn', 0x4a4038, 1), pl = villa_mat('wall_plaster', 0x5e5a54, 2), co = villa_mat('facade_concrete', 0x6a665e, 1.5);
  const w = R.x1 - R.x0, d = R.z1 - R.z0; plane(w, d, (R.x0 + R.x1) / 2, .01, (R.z0 + R.z1) / 2, fl, -PI / 2, 0, VILLA.g); villa_box(w + .4, .2, d + .4, (R.x0 + R.x1) / 2, R.h + .1, (R.z0 + R.z1) / 2, pl, { cast: false });
  villa_wand('x', R.z0, R.x0, R.x1, R.h, co); villa_wand('x', R.z1, R.x0, R.x1, R.h, wp); villa_wand('z', R.x0, R.z0, R.z1, R.h, co); villa_wand('z', R.x1, R.z0, R.z1, R.h, wp);
  villa_wand('z', -980, R.z0, R.z1, R.h, wp, [{ at: 898, w: 1 }], .14); indoorRects.push({ x0: R.x0, x1: R.x1, zb: R.z0, zf: R.z1, y: 0 });
  { const gm = villa_mat('garagedoor', 0x8a8680, 3); plane(3.1, 2.3, -982.5, 1.15, R.z0 + .11, gm, 0, 0, VILLA.g); }
  villa_hit(1.6, 2.2, .4, -983.8, 1.1, R.z0 + .3, 'Nach draußen', () => villa_nr9Raus());
  // Garage: Werkbank (Metalltisch), Kanister, Mülltonne
  { const t = await villa_put('metaltable', 'model.gltf', .95, 'y', R.x0 + .5, 898.8, PI / 2); if (t) t.scale.x *= .6; }
  await villa_put('jerrycan', 'model.gltf', .45, 'y', R.x0 + .4, 896.6, .4); await villa_put('trashcan', 'model.gltf', .9, 'y', -981.2, 900.3, .2);
  // Wohnzimmer: Klappstuhl, Stativ mit Kamera am Fenster (Nordwand), Thermoskanne, Ascher, Butterbrotpapier, Dienstplan, Schwarzes Brett, Ringbuch
  await villa_fbx('chair', VILLA_SPEC.chair, .9, 'y', -977.6, 899.6, PI - .3);
  const kam = await villa_put('w_kamera', 'model.glb', .22, 'max', -977.2, 900.35, PI, 1.38);
  { const st = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 1.38, 6), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: .5, metalness: .7 })); st.position.set(-977.2, .69, 900.35); VILLA.g.add(st); }
  await villa_put('w_thermos', 'model.glb', .3, 'y', -976.4, 899.9, .3, 0); try { await villa_put('kiffen/ascher', 'model.glb', .12, 'max', -976.2, 899.5, 0, .02); } catch (e) {}
  const tisch = await villa_put('metaltable', 'model.gltf', .78, 'y', -976.3, 897, 0); if (tisch) { tisch.scale.x *= .5; tisch.scale.z *= .7; }
  await villa_put('w_buch', 'model.glb', .24, 'max', -976.3, 897, .4, .79);
  villa_decal(villa_cv(256, 256, (c, w, h) => { c.clearRect(0, 0, w, h); for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(236,230,210,${.8 + i * .03})`; c.fillRect(20 + i * 3, 40 + i * 20, 200, 60); c.strokeStyle = 'rgba(150,140,110,.4)'; c.strokeRect(20 + i * 3, 40 + i * 20, 200, 60); } }),
    .3, .3, -975.9, .8, 896.4, -PI / 2, 0, { alpha: true });
  // Gardine mit Loch (Decal), Dienstplan, Schwarzes Brett
  villa_decal(villa_cv(256, 256, (c, w, h) => { c.fillStyle = '#6a5c48'; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 9) { c.fillStyle = `rgba(0,0,0,${.12 + Math.random() * .1})`; c.fillRect(x, 0, 4, h); }
    c.fillStyle = '#0a0a0c'; c.beginPath(); c.arc(w * .62, h * .44, 9, 0, 7); c.fill(); }), 1.8, 1.9, -977.4, 1.3, R.z1 - .12, 0, PI);
  villa_zettel(['DIENSTPLAN · POSTEN 9', '', 'Mo  N11', 'Di  N12', 'Mi  N11', 'Do  AMT', 'Fr  N12', 'Sa  N11', 'So  N12', '', 'SEHEN · BERGEN · SCHWEIGEN'], .34, .46, R.x1 - .12, 1.5, 899.2, 0, -PI / 2, { font: '14px "Courier New", monospace', grund: '#cfcac0' });
  villa_zettel(['DA 11 · Okt. 2026', 'K-3 ist heil.', 'Wiederhole: heil.', '…', '', 'DA 10 · 2012', 'Abwicklung AST 7', 'Archivräume', '…'], .4, .52, R.x1 - .12, 1.55, 897.3, 0, -PI / 2, { font: '14px "Courier New", monospace', grund: '#c4c2bc', fuss: 'SEHEN · BERGEN · SCHWEIGEN' });
  villa_licht(-977, 2.2, 898, 0xd8dce8, .45, 6); villa_licht(-983, 2.2, 898, 0xffd8a0, .3, 5);
  villa_hit(.5, .4, .4, -976.3, .9, 897, 'Ringbuch', () => villa_nr9Ringbuch());
  villa_hit(.3, 1.6, .5, R.x1 - .2, 1.5, 899.2, 'Dienstplan', () => { villa_note('Dienstplan · Posten 9', villa_masch('Mo N11 · Di N12 · Mi N11 · <u><b>Do AMT</b></u> · Fr N12 · Sa N11 · So N12') + '\n\n' + villa_hand('Donnerstag ist unterstrichen. Zweimal.'), 'villa_dienstplan'); villa_setz('dienstplan'); });
  villa_hit(.3, .8, .6, R.x1 - .2, 1.55, 897.3, () => villa_hat('da10') ? 'Schwarzes Brett' : 'Schwarzes Brett · Dienstanweisungen', () => villa_nr9Brett());
  villa_hit(.6, 1.1, .6, -977.2, 1.2, 900.3, 'Durch das Kameraloch sehen', () => villa_nr9Kamera());
  villa_hit(.7, .9, .7, -977.6, .5, 899.6, 'Klappstuhl', () => { villa_note('Auf dem Klappstuhl', 'Ein Kreuzworträtselheft, halb gelöst. Eine Lösung ist mit Bleistift eingetragen und falsch:\n\n' + villa_blei('Himmelskörper, 5 Buchstaben: <b>UFO</b>') + '\n\nDaneben, andere Schrift: ' + villa_hand('„Passt nicht. Nachzählen.“'), 'villa_raetselheft'); });
  villa_hit(.5, .6, .5, -976.4, .3, 899.9, 'Thermoskanne und Aschenbecher', () => toast('Eine Thermoskanne, kalt. Ein Aschenbecher voller Kippen ohne Filter. Daneben Butterbrotpapier, sorgfältig gefaltet. Ein Stapel.', 4600));
  void kam; };
// ---- Arbeitszimmer (UK 7): Bücherwand, Schreibtisch mit grüner Lampe, Aktenschrank (fünf Schubladen), Weltkarte, Fotowand, ASSERVAT 7/58
VILLA_BAU.az = async R => {
  const wp = villa_mat('wallpaper_old', 0x6e6452, 1.4), fl = villa_mat('floor_wood', 0x46321f, .9), pl = villa_mat('wall_plaster', 0x6a665e, 2); fl.roughness = .55;
  villa_raum(R, wp, fl, pl); const T = THREE;
  await villa_put('door2', 'model.gltf', 2.15, 'y', R.x1 - .06, 898, -PI / 2);
  villa_hit(.4, 2.2, 1.2, R.x1 - .25, 1.1, 898, 'In die Halle', () => villa_geh('halle', { p: VILLA_TUER.halleW }));
  // Bücherwand (Nordwand): drei Regale
  for (const x of [-919.6, -917.8, -916]) await villa_put('shelf', 'model.gltf', 1.6, 'x', x, R.z1 - .3, PI, 0);
  // Schreibtisch mit Lampe, Stuhl; Foto mit Nadel
  { const t = await villa_put('metaltable', 'model.gltf', .8, 'y', -917, 899.2, 0); if (t) { t.scale.x *= .8; } }
  VILLA.o.azStuhl = await villa_fbx('chair', VILLA_SPEC.chair, .92, 'y', -917, 898.3, .1);
  await villa_put('floorlamp', 'model.gltf', 1.55, 'y', -915.9, 899.9, -.4);
  villa_licht(-916.2, 1.4, 899.6, 0x9fd8a0, 1.5, 6); villa_licht(-917, 3, 900.5, 0xffd8a8, .9, 9);
  villa_zettel(['An den, der die', 'acht Teile …'], .16, .2, -917.3, .83, 899.1, -PI / 2, .3, { font: '16px Caveat, cursive' });
  // Aktenschrank (Ostwand südlich der Tür): Anrichte-Scan als Rückfall, mit fünf Messingschildern
  const ak = await villa_fbx('dresser', VILLA_SPEC.hutch, 1.35, 'y', R.x0 + .4, 897.8, PI / 2);
  villa_decal(villa_cv(256, 128, (c, w, h) => { c.clearRect(0, 0, w, h); ['1941', '1958', '1975', '1992', '2009'].forEach((t, i) => { c.fillStyle = '#b89a50'; c.fillRect(8 + i * 49, 40, 42, 24); c.fillStyle = '#2a2014'; c.font = 'bold 15px Georgia'; c.fillText(t, 12 + i * 49, 58); });
    c.fillStyle = '#e8e0c8'; c.fillRect(70, 84, 120, 36); c.fillStyle = '#26241f'; c.font = '12px Caveat, cursive'; c.fillText('Heinrichs Sachen liegen,', 74, 98); c.fillText('wo er stehen geblieben ist.', 74, 113); }), .8, .4, R.x0 + .85, 1.05, 897.8, 0, PI / 2, { alpha: true });
  villa_hit(.8, 1.4, 1.2, R.x0 + .5, .7, 897.8, 'Aktenschrank', () => villa_azSchrank());
  void ak;
  // Weltkarte (Westwand) mit neun Nadeln
  villa_decal(villa_cv(512, 300, (c, w, h) => { c.fillStyle = '#d8ceae'; c.fillRect(0, 0, w, h); c.fillStyle = '#a89a72'; const L = [[60, 70, 110, 90], [150, 170, 60, 100], [230, 60, 70, 60], [240, 130, 80, 110], [320, 60, 150, 100], [400, 190, 60, 50]];
    for (const [x, y, a, b] of L) { c.beginPath(); c.ellipse(x + a / 2, y + b / 2, a / 2, b / 2, .3, 0, 7); c.fill(); }
    const N = [[262, 88], [300, 96], [120, 110], [420, 120], [180, 210], [360, 100], [270, 92], [440, 220], [330, 170]]; N.forEach(([x, y], i) => { c.fillStyle = i === 6 ? '#b01818' : '#303030'; c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); c.fillStyle = '#26241f'; c.font = '12px Caveat, cursive'; c.fillText(String(i + 1) + (i === 6 ? ' wir.' : ''), x + 6, y - 4); });
    for (let i = 0; i < 7; i++) { c.fillStyle = '#efe9da'; c.fillRect(10 + i * 70, 250, 58, 40); c.fillStyle = '#555'; for (let r = 0; r < 4; r++) c.fillRect(14 + i * 70, 256 + r * 8, 48, 2); } }), 1.9, 1.12, R.x0 + .12, 1.75, 901.6, 0, PI / 2);
  villa_hit(.3, 1.2, 2, R.x0 + .2, 1.75, 901.6, 'Weltkarte mit Nadeln', () => villa_azKarte());
  // Fotowand (Südwand): sechs Fotos, Wolter am Rand
  VILLA.o.fotos = [];
  const FT = [['Lehrgang, Herbst 1957', 'jung'], ['Einweihung der Außenstelle, Frühjahr 1958', 'alt'], ['1975', 'alt'], ['1992 · Pell und „Buck“', 'pell'], ['2009', 'alt'], ['2012', 'alt']];
  FT.forEach(([t, art], i) => { const cv = villa_cv(160, 200, (c, w, h) => { c.fillStyle = '#e8e2d2'; c.fillRect(0, 0, w, h); const g = c.createLinearGradient(0, 20, 0, 160); g.addColorStop(0, '#8a8478'); g.addColorStop(1, '#4a463e'); c.fillStyle = g; c.fillRect(12, 12, w - 24, 140);
      for (let k = 0; k < 4; k++) { c.fillStyle = 'rgba(30,28,24,.8)'; c.fillRect(30 + k * 24, 70, 14, 60); c.beginPath(); c.arc(37 + k * 24, 62, 8, 0, 7); c.fill(); }
      c.fillStyle = art === 'jung' ? 'rgba(40,38,34,.9)' : 'rgba(22,20,18,.95)'; c.fillRect(w - 38, art === 'jung' ? 64 : 58, 16, 72); c.beginPath(); c.arc(w - 30, art === 'jung' ? 56 : 50, 8, 0, 7); c.fill(); if (art !== 'jung') c.fillRect(w - 42, 40, 24, 5);
      if (art === 'pell') { c.fillStyle = 'rgba(60,40,24,.9)'; c.beginPath(); c.ellipse(60, 110, 22, 14, 0, 0, 7); c.fill(); c.fillRect(44, 80, 3, 26); c.fillRect(72, 80, 3, 26); }
      c.fillStyle = '#3a3630'; c.font = '11px Georgia'; c.fillText(t.slice(0, 26), 12, 172); c.fillText(t.slice(26), 12, 186); });
    VILLA.o.fotos.push(villa_decal(cv, .32, .4, -920.2 + i * .58, 1.62 + (i % 2) * .06, R.z0 + .12, 0, 0)); });
  villa_hit(3.6, 1, .4, -918.8, 1.65, R.z0 + .3, 'Fotowand', () => villa_azFotos());
  // Asservatenkiste unter dem Schreibtisch (Holz-Scan, Schablonenschrift, Siegel mit dem Auge) – Rückfall: kein Kisten-Scan vorhanden
  { const holz = villa_mat('planks_painted', 0x6a5a40, .6); const k = villa_box(.7, .42, .45, -917.6, .21, 899.5, holz, { collide: false }); k.castShadow = true;
    villa_decal(villa_cv(256, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(20,18,14,.85)'; c.font = 'bold 30px "Courier New"'; c.fillText('ASSERVAT 7/58', 12, 56); c.fillStyle = '#8a1a14'; c.beginPath(); c.arc(214, 90, 20, 0, 7); c.fill(); c.strokeStyle = '#e8c0a0'; c.lineWidth = 2; c.beginPath(); c.ellipse(214, 90, 12, 7, 0, 0, 7); c.stroke(); }),
      .6, .3, -917.6, .24, 899.27, 0, PI, { alpha: true }); }
  villa_hit(.8, .5, .6, -917.6, .25, 899.4, () => villa_hat('sb08') ? 'Asservatenkiste (offen)' : 'Kiste unter dem Schreibtisch · ASSERVAT 7/58', () => villa_azAsservat());
  villa_hit(.6, .3, .5, -917.2, .9, 899.2, 'Schreibtisch', () => villa_azTisch());
  villa_hit(4.8, 1.8, .5, -917.8, 1.1, R.z1 - .35, 'Bücherwand', () => villa_note('Die Bücherwand', 'Fachliteratur, Reihe um Reihe. Dazwischen ein Taschenbuch: <b>„Die Wahrheit über Area 51“</b>, voller Randnotizen in Seilers Schrift:\n\n' + villa_hand('„Falsch.“ – „Falsch.“ – „Fast.“') + '\n\n' + villa_hand('Er hat Vegas’ Bücher gelesen. Und korrigiert.'), 'villa_area51'));
  villa_hit(.7, 1, .7, -917, .5, 898.3, 'Schreibtischstuhl', () => toast(villa_hat('stuhl') ? 'Die Sitzfläche ist warm. Der Stuhl ist zur Fotowand gedreht.' : 'Ein Schreibtischstuhl, unter den Tisch geschoben.', 3400));
  // Whiskey klopft von außen (Fenster der Westwand) – als Klang am Fenster
  void T; };
// ---- Anrichte (UK 8/10): Buffet, Dienstbotentreppe (oben: Archiv), Kellertür (unten) – beide mit Nadelschlitz
VILLA_BAU.an = async R => {
  const wp = villa_mat('wallpaper_old', 0x7a705e, 1.4), fl = villa_mat('floor_worn', 0x5a4c3c, 1), pl = villa_mat('wall_plaster', 0x6a665e, 2), dk = villa_mat('planks_painted', 0x3a2e24, 1);
  villa_raum(R, wp, fl, pl);
  await villa_put('door2', 'model.gltf', 2.15, 'y', R.x0 + .06, 900, PI / 2);
  villa_hit(.4, 2.2, 1.2, R.x0 + .25, 1.1, 900, 'In die Halle', () => villa_geh('halle', { p: VILLA_TUER.halleO }));
  await villa_fbx('dresser', VILLA_SPEC.hutch, 2.0, 'y', -886.2, 898.6, -PI / 2);
  // Dienstbotentreppe (Nordostecke): Stufen aus Brettern, oben eine Tür mit Messingschild
  for (let k = 0; k < 6; k++) villa_box(1.1, .18, .3, -886.2, .09 + k * .18, 901.2 + k * .3 - 1.4, dk, { collide: k < 2 });
  await villa_put('door1', 'model.gltf', 2.05, 'y', -887.6, R.z1 - .06, PI);
  const schild = villa_cv(128, 96, (c, w, h) => { c.fillStyle = '#b89a50'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a2014'; c.fillRect(54, 20, 20, 5); c.strokeStyle = '#2a2014'; c.lineWidth = 2; c.beginPath(); c.ellipse(64, 50, 16, 9, 0, 0, 7); c.stroke(); c.beginPath(); c.arc(64, 50, 4, 0, 7); c.fill();
    c.font = '9px Georgia'; c.fillText('Zutritt nur mit', 28, 76); c.fillText('Dienstnadel', 36, 88); });
  villa_decal(schild, .12, .09, -887.2, 1.1, R.z1 - .1, 0, PI, { metal: .6, rough: .4 });
  villa_hit(1.1, 2.2, .4, -887.6, 1.1, R.z1 - .3, () => villa_item('dienstnadel') ? 'Dienstbotentreppe · Nadel in den Schlitz' : 'Dienstbotentreppe · Tür mit Messingschild', () => villa_anOben());
  // Kellertür (Südwand)
  await villa_put('door1', 'model.gltf', 2.05, 'y', -889.4, R.z0 + .06, 0);
  villa_decal(schild, .12, .09, -889, 1.1, R.z0 + .1, 0, 0, { metal: .6, rough: .4 });
  villa_hit(1.1, 2.2, .4, -889.4, 1.1, R.z0 + .3, () => villa_item('dienstnadel') ? 'Kellertür · Nadel in den Schlitz' : 'Kellertür · Messingschild', () => villa_anUnten());
  // Fenster zum Garten (Ostwand) – Whiskey sitzt draußen auf dem Sims
  villa_decal(villa_cv(128, 160, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#b8c0c8'); g.addColorStop(1, '#8a9098'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.strokeStyle = '#3a3026'; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8); c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke(); }),
    .7, .9, R.x1 - .11, 1.6, 900.4, 0, -PI / 2, { glow: .35 });
  villa_licht(-888, 2.6, 900, 0xfff0d8, .7, 6); };
// ---- Obergeschoss Ost (UK 8/9): Archiv (Rollregale, Tisch, Leselampe, Garderobenschrank, Vorhang) und Heinrichs Zimmer (Bett, Heizung, Teedose)
VILLA_BAU.og = async R => {
  const wp = villa_mat('wallpaper_old', 0x746a58, 1.4), fl = villa_mat('floor_worn', 0x50443a, 1), pl = villa_mat('wall_plaster', 0x6a665e, 2), holz = villa_mat('planks_painted', 0x5a4a38, .7);
  villa_raum(R, wp, fl, pl); villa_wand('z', -893, R.z0, R.z1, R.h, wp, [{ at: 929, w: 1 }], .16);
  await villa_put('door1', 'model.gltf', 2.05, 'y', -896, R.z0 + .06, 0);
  villa_hit(1.1, 2.2, .4, -896, 1.1, R.z0 + .3, 'Dienstbotentreppe hinunter', () => villa_ogRunter());
  // Rollregale (Holzklötze mit Holz-Scan, Kurbeln) + Rücken-Schilder
  const REG = ['KORRESPONDENZ', 'LISTEN 1958 BIS 2009', 'BERGUNG', 'OBJEKT DREIPUNKT', 'VERSUCHSREIHE K', 'BESTAND'];
  VILLA.o.regal = {};
  REG.forEach((n, i) => { const x = -907.1 + i * 2.2; villa_box(1.6, 2.2, .55, x + .8, 1.1, 932.3, holz, { collide: true });
    villa_decal(villa_cv(256, 40, (c, w, h) => { c.fillStyle = '#e8e2d0'; c.fillRect(0, 0, w, h); c.fillStyle = '#26241f'; c.font = 'bold 17px "Courier New"'; c.fillText(n, 8, 26); }), .9, .14, x + .8, 1.95, 932.01, 0, PI);
    for (let r = 0; r < 4; r++) villa_decal(villa_cv(128, 64, (c, w, h) => { c.fillStyle = '#3a342a'; c.fillRect(0, 0, w, h); for (let k = 0; k < 9; k++) { c.fillStyle = ['#8a7a5a', '#6a5a44', '#9a8a6a', '#5a4c3a'][k % 4]; c.fillRect(4 + k * 13, 6 + (k % 3) * 3, 11, 56); } }), 1.5, .38, x + .8, .4 + r * .48, 932.02, 0, PI);
    VILLA.o.regal[n] = x + .8; });
  // Tisch, Stuhl, Leselampe; Garderobenschrank (Versteck 1), Vorhang am Fenster (Versteck 2)
  { const t = await villa_put('metaltable', 'model.gltf', .78, 'y', -900.5, 929.6, 0); if (t) t.scale.x *= .8; }
  await villa_fbx('chair', VILLA_SPEC.chair, .9, 'y', -900.5, 928.8, .2);
  await villa_put('floorlamp', 'model.gltf', 1.5, 'y', -899.3, 930.4, -.2);
  VILLA.o.schrank = await villa_put('wardrobe', 'model.gltf', 2.1, 'y', R.x0 + .45, 929.2, PI / 2);
  VILLA.o.schrank2 = await villa_put('wardrobe', 'model.gltf', 2.1, 'y', R.x0 + .45, 930.9, PI / 2);
  villa_decal(villa_cv(256, 256, (c, w, h) => { c.fillStyle = '#4a3a2e'; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 7) { c.fillStyle = `rgba(0,0,0,${.15 + Math.random() * .15})`; c.fillRect(x, 0, 3, h); } }), 1.3, 2.3, -903.4, 1.25, R.z0 + .14, 0, 0);
  villa_licht(-899.4, 1.5, 930.3, 0xffd8a0, .9, 6); VILLA.o.ogLicht = villa_licht(-900, 2.7, 930, 0xffe8c8, 0, 9);
  // Heinrichs Zimmer: schmales Bett, Heizung (5), Mantelhaken ohne Mantel, Teedose, beschlagene Scheibe mit ∴
  await villa_fbx('hospbed', VILLA_SPEC.bed, 0, 'y', -887.2, 930.8, PI / 2, 0, [.008, .008, -.008]);
  VILLA.o.teedose = await villa_put('w_blech', 'model.glb', .12, 'max', -888.4, 932.5, .3, .62);
  await villa_fbx('dresser', VILLA_SPEC.hutch, .62, 'y', -888.4, 932.5, PI).catch?.(() => null);
  villa_decal(villa_cv(96, 96, (c, w, h) => { c.fillStyle = '#e8ecee'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a2a2a'; c.font = 'bold 30px Georgia'; c.fillText('HEINRICH', 2, 58); }), .3, .1, -893.1, 2.05, 929, 0, -PI / 2);
  villa_decal(villa_cv(128, 160, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#c8ccd0'); g.addColorStop(1, '#a0a6ac'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(60,70,80,.55)'; for (const [x, y] of [[52, 70], [76, 70], [64, 92]]) { c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); } c.strokeStyle = '#3a3026'; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8); }), .7, .9, -889.6, 1.55, R.z0 + .12, 0, 0, { glow: .25 });
  villa_licht(-889.5, 2.4, 930, 0xffd0a0, .5, 5);
  // Interaktionen Archiv
  villa_hit(1.6, 2, .6, VILLA.o.regal['BESTAND'], 1.1, 932, 'Regal BESTAND · Bestandsliste', () => villa_ogBestand());
  villa_hit(1.6, 2, .6, VILLA.o.regal['VERSUCHSREIHE K'], 1.1, 932, 'Regal VERSUCHSREIHE K · die K-Akten', () => villa_ogKAkten());
  villa_hit(1.6, 2, .6, VILLA.o.regal['LISTEN 1958 BIS 2009'], 1.1, 932, 'Regal LISTEN · vier Mappen', () => villa_ogListen());
  villa_hit(1.6, 2, .6, VILLA.o.regal['BERGUNG'], 1.1, 932, 'Regal BERGUNG · Karton „W“', () => villa_ogPell());
  villa_hit(1.6, 2, .6, VILLA.o.regal['OBJEKT DREIPUNKT'], 1.1, 932, 'Regal OBJEKT DREIPUNKT', () => villa_ogDreipunkt());
  villa_hit(1.6, 2, .6, VILLA.o.regal['KORRESPONDENZ'], 1.1, 932, 'Regal KORRESPONDENZ', () => toast('Briefe an eine Regionalleitung, Briefe von einer Regionalleitung. Jeder zweite endet mit „Das ist bedauerlich“.', 4200));
  villa_hit(1, .4, .7, -900.5, .9, 929.6, 'Tisch · Formblatt 8', () => villa_ogFormblatt());
  VILLA.o.hSchrank = villa_hit(.8, 2.1, 1.2, R.x0 + .5, 1.05, 929.2, 'Garderobenschrank', () => villa_verstecken('schrank'));
  VILLA.o.hVorhang = villa_hit(1.2, 2.2, .5, -903.4, 1.1, R.z0 + .35, 'Vorhang am Fenster', () => villa_verstecken('vorhang'));
  VILLA.o.hBett = villa_hit(2.1, .7, 1, -887.2, .4, 930.8, 'Heinrichs Bett', () => villa_verstecken('bett'));
  villa_hit(.4, .4, .4, -888.4, .75, 932.5, 'Teedose aus Blech', () => villa_ogTeedose());
  villa_hit(.6, .7, .5, -886.4, .5, 928.4, 'Heizung', () => toast('Die Heizung ist bis zum Anschlag aufgedreht. Fünf. Der Mantelhaken daneben ist leer. Unter dem Bett eine leere Blechdose, in der mal graue Pastillen waren.', 5200));
  villa_hit(.8, 1, .4, -889.6, 1.55, R.z0 + .3, 'Beschlagene Scheibe', () => toast('Es ist so warm, dass die Scheibe beschlägt. Und in der beschlagenen Scheibe steht, von innen geschrieben: ∴', 4200)); };
// ---- Keller (UK 10): Kühlraum mit Kacheln, Stahltisch, zwei Gläsern, Regalen; Sicherungskasten; Schleuse; Zellengang mit Zelle Ost
VILLA_BAU.kr = async R => {
  const kach = villa_mat('sidewalk_tiles', 0xd6dcd8, .5), fl = villa_mat('sidewalk_tiles', 0x9aa09c, .45), pl = villa_mat('wall_plaster', 0x8a8e8c, 2), co = villa_mat('facade_concrete', 0x6a6c6a, 1.5), T = THREE;
  const w = R.x1 - R.x0, d = R.z1 - R.z0; plane(w, d, (R.x0 + R.x1) / 2, .01, (R.z0 + R.z1) / 2, fl, -PI / 2, 0, VILLA.g); villa_box(w + .4, .2, d + .4, (R.x0 + R.x1) / 2, R.h + .1, (R.z0 + R.z1) / 2, pl, { cast: false });
  villa_wand('x', R.z0, R.x0, -898, R.h, kach); villa_wand('x', R.z1, R.x0, -898, R.h, kach); villa_wand('z', R.x0, R.z0, R.z1, R.h, kach);
  villa_wand('x', R.z0, -898, R.x1, R.h, co); villa_wand('x', R.z1, -898, R.x1, R.h, co); villa_wand('z', R.x1, R.z0, R.z1, R.h, co);
  villa_wand('z', -898, R.z0, R.z1, R.h, kach, [{ at: 870.2, w: 1.2 }], .25); villa_wand('x', 868.6, -898, -893.2, R.h, co, [{ at: -895.6, w: 1 }], .14); villa_wand('z', -893.1, R.z0, 868.6, R.h, co, [], .14);
  villa_wand('x', 868.6, -893, R.x1, R.h, co, [{ at: -890.5, w: 1.1 }], .14);
  indoorRects.push({ x0: R.x0, x1: R.x1, zb: R.z0, zf: R.z1, y: 0 });
  // Kellertreppe (Ausgang, Westwand)
  await villa_put('door1', 'model.gltf', 2.05, 'y', R.x0 + .06, 869, PI / 2);
  villa_hit(.4, 2.2, 1.2, R.x0 + .25, 1.1, 869, 'Kellertreppe hinauf', () => villa_krRauf());
  // Schleuse (Stahltür, gleitet)
  const stahl = new T.MeshStandardMaterial({ color: 0x8a8e90, roughness: .45, metalness: .8 }); VILLA.o.schleuse = villa_box(.12, 2.3, 1.22, -898, 1.15, 870.2, stahl, { collide: true }); VILLA.o.schleuseCol = VILLA.o.schleuse.userData.col; VILLA.o.schleuseCol0 = { ...VILLA.o.schleuseCol };
  villa_decal(villa_cv(256, 64, (c, w, h) => { c.fillStyle = '#e8e4d8'; c.fillRect(0, 0, w, h); c.fillStyle = '#1a1a1a'; c.font = 'bold 30px "Courier New"'; c.fillText('ZELLENGANG', 26, 42); }), .5, .12, -898.08, 2.05, 870.2, 0, -PI / 2);
  // Stahltisch mit den Gläsern, Regale, Abfluss, Lüftungsfenster
  { const t = await villa_put('metaltable', 'model.gltf', .86, 'y', -903.6, 869, PI / 2); VILLA.o.tischY = t ? new T.Box3().setFromObject(t).max.y : .86; }
  for (const [x, z, ry] of [[-907.5, 867.2, PI / 2], [-907.5, 870.6, PI / 2], [-901, 871.6, PI]]) await villa_put('shelf', 'model.gltf', 1.4, 'x', x, z, ry, 0);
  villa_decal(villa_cv(64, 64, (c, w, h) => { c.fillStyle = '#2a2c2c'; c.beginPath(); c.arc(32, 32, 26, 0, 7); c.fill(); c.strokeStyle = '#7a7e7e'; c.lineWidth = 3; for (let i = -18; i <= 18; i += 6) { c.beginPath(); c.moveTo(14, 32 + i); c.lineTo(50, 32 + i); c.stroke(); } }), .28, .28, -902, .015, 867.6, -PI / 2, 0, { alpha: true });
  villa_decal(villa_cv(128, 64, (c, w, h) => { c.fillStyle = '#1a1c1c'; c.fillRect(0, 0, w, h); c.strokeStyle = '#6a6e6e'; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6); }), .6, .3, -904.5, 2.55, R.z0 + .12, 0, 0);
  // Gläser: transparente Zylinder, in ∴-1 gekrümmt das Beobachter-Modell, trüb überlagert
  const ty = VILLA.o.tischY; const glasM = new T.MeshStandardMaterial({ color: 0xdfe8e6, roughness: .08, metalness: .1, transparent: true, opacity: .22, depthWrite: false, side: T.DoubleSide });
  const milch = new T.MeshStandardMaterial({ color: 0xe8ecea, roughness: .6, transparent: true, opacity: .5, depthWrite: false }), deckM = new T.MeshStandardMaterial({ color: 0x2a2826, roughness: .5, metalness: .85 });
  const glas = (x, voll) => { const g = new T.Group(); g.position.set(x, ty, 869); VILLA.g.add(g); const c = new T.Mesh(new T.CylinderGeometry(.34, .34, .82, 28, 1, true), glasM); c.position.y = .41; c.renderOrder = 12; g.add(c);
    const bo = new T.Mesh(new T.CylinderGeometry(.35, .35, .03, 28), deckM); bo.position.y = .015; g.add(bo);
    const m = voll ? new T.Mesh(new T.CylinderGeometry(.325, .325, .72, 28), milch) : null; if (m) { m.position.y = .39; m.renderOrder = 11; g.add(m); }
    if (!voll) { const r = new T.Mesh(new T.TorusGeometry(.33, .006, 6, 32), new T.MeshStandardMaterial({ color: 0xb8b0a0, roughness: .9 })); r.rotation.x = PI / 2; r.position.y = .12; g.add(r); } return { g, m }; };
  const g1 = glas(-903.6, true), g2 = glas(-903.6 + .95, false); g1.g.position.z = 868.8; g2.g.position.z = 869.2;
  VILLA.glas = { g1, g2, fig: null, fig0: null, deckel1: null, deckel2: null, milch, t: 0 };
  { const d1 = new T.Mesh(new T.CylinderGeometry(.35, .35, .04, 28), deckM); d1.position.set(0, .84, 0); g1.g.add(d1); VILLA.glas.deckel1 = d1;
    const bg = new T.Mesh(new T.TorusGeometry(.2, .012, 6, 20, PI), deckM); bg.position.set(0, .86, 0); bg.rotation.y = PI / 2; g1.g.add(bg); VILLA.glas.buegel = bg;
    const d2 = new T.Mesh(new T.CylinderGeometry(.35, .35, .04, 28), deckM); d2.position.set(-903.6 + .95 + .55, ty + .02, 869.9); VILLA.g.add(d2); VILLA.glas.deckel2 = d2; }
  try { const src = await msModel('beobachter', 'model.glb'); const f = msFit(src.clone(true), .62, 'y'); const fb = new T.Box3().setFromObject(f), c = fb.getCenter(new T.Vector3()); f.position.sub(c);
    const piv = new T.Group(); piv.add(f); piv.rotation.set(-.9, .4, .3); piv.position.set(0, .36, 0); g1.g.add(piv);
    f.traverse(q => { if (q.isMesh) { q.castShadow = false; q.renderOrder = 10; if (q.material) { q.material = q.material.clone(); q.material.color && q.material.color.multiplyScalar(.85); } } }); VILLA.glas.fig = piv; VILLA.glas.fig0 = { rx: -.9, ry: .4, rz: .3, x: 0, z: 0 };
  } catch (e) { console.warn('Villa: Beobachter im Glas', e); }
  villa_zettel(['∴-1 · 1958', 'NICHT ÖFFNEN'], .14, .07, -903.6, ty + .88, 868.8, -PI / 2 + .2, 0, { w: 256, h: 128, font: 'bold 34px "Courier New"', y0: 50, lh: 44 });
  VILLA.glas.fleck = villa_decal(villa_cv(64, 64, (c, w, h) => { const g = c.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }), .2, .2, -903.6 + .345, ty + .45, 868.8, 0, PI / 2, { alpha: true });
  VILLA.glas.fleck.material.opacity = 0; VILLA.glas.fleck.material.transparent = true;
  villa_zettel(['BEOBACHTUNGSBLATT', 'DREIPUNKT', '∴-1 · ∴-2 · ∴-3'], .21, .28, -903.1, ty + .55, 868.62, 0, 0, { font: 'bold 15px "Courier New"' });
  // Nierenschale mit dem Splitter (Probe zu S-7)
  villa_zettel(['Subjekt EISEN,', 'Rüstung, 1958'], .12, .05, -904.1, ty + .012, 869.5, -PI / 2, .4, { w: 256, h: 110, font: '26px "Courier New"', y0: 40, lh: 34 });
  // Nasse dreizehige Abdrücke (S-02, Pflicht): vom Glas bis unter das Lüftungsfenster
  for (let i = 0; i < 6; i++) villa_spur('abdruck', { pos: [-903.2 - i * .22, .02, 868.2 - i * .3], ry: -PI / 2 + .3, n: 1 });
  // Sicherungskasten an der Trennwand (Kühlraumseite), Zettel darüber
  VILLA.o.kasten = villa_decal(villa_cv(256, 320, (c, w, h) => { c.fillStyle = '#5a5e5c'; c.fillRect(0, 0, w, h); c.fillStyle = '#3a3c3a'; c.fillRect(10, 10, w - 20, h - 20);
    const F = ['#a02018', '#a02018', '#7a7e80', '#2a4a9a', '#2a4a9a', '#7a7e80'], N = ['HALLE', 'ARB.-ZI.', 'OG', 'GARTEN', '', '']; F.forEach((f, i) => { const x = 50 + (i % 3) * 78, y = 70 + Math.floor(i / 3) * 110; c.fillStyle = f; c.beginPath(); c.arc(x, y, 22, 0, 7); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(x, y, 13, 0, 7); c.fill();
      c.fillStyle = '#e8e4d8'; c.fillRect(x - 32, y + 30, 64, 16); c.fillStyle = '#1a1a1a'; c.font = 'bold 11px Arial'; c.fillText(N[i] || '~~~~', x - 26, y + 42); });
    c.fillStyle = '#1a1a1a'; c.fillRect(100, 270, 56, 36); c.fillStyle = '#2a2a2a'; c.fillRect(120, 250, 16, 40); }), .5, .62, -898.14, 1.35, 867.3, 0, -PI / 2);
  villa_zettel(['Nie mehr als drei gleichzeitig.', 'Sonst fliegt die Hauptsicherung,', 'und die sitzt im Umspannwerk.', 'Dann weiß das ganze Dorf,', 'dass hier einer ist.'], .34, .2, -898.14, 1.86, 866.75, 0, -PI / 2, { w: 320, h: 180, font: '18px Caveat, cursive' });
  villa_hit(.4, .9, .8, -898.3, 1.35, 867.3, 'Sicherungskasten', () => villa_krKasten());
  villa_hit(.9, 1, .9, -903.6, ty + .4, 868.8, '∴-1', () => villa_krGlas1());
  villa_hit(.9, 1, .9, -902.65, ty + .4, 869.2, '∴-2', () => villa_note('∴-2', 'Leer. Schon lange. Innen ein trockener Rand, wie in einer Vase, in der seit Jahren nichts steht.\n\nDer Eisendeckel liegt daneben auf dem Tisch, ordentlich hingelegt, nicht heruntergeworfen.', 'villa_glas2'));
  villa_hit(.4, .6, .3, -903.1, ty + .55, 868.62, 'Beobachtungsblatt DREIPUNKT', () => villa_note('Beobachtungsblatt DREIPUNKT', villa_masch('∴-1 · gefangen 1958, Eisennetz · † sofort · konserviert.\n∴-2 · gefangen 1958 · † nach 11 Tagen · hat 11 Tage lang zugesehen · konserviert · Glas seit ████ leer · Spuren dreizehig, nass, zum Fenster.\n∴-3 · frei · nicht fixierbar · seit 1958 611 Zettel, 0 Aufnahmen · Foto 1975 (Seiler) vernichtet.') + '\n\n' + villa_hand('Vermerk (Seiler, 2012): „Er hat mich fotografiert. Ich glaube, er hat das Foto noch. Ich glaube, er hat alles noch.“'), 'villa_dreipunkt', () => villa_gedanke('villa_drei', 'Drei Punkte. Er unterschreibt mit drei Punkten. Zwei davon stehen hier.')));
  villa_hit(.4, .3, .4, -904.1, ty + .1, 869.5, 'Nierenschale', () => villa_krSplitter());
  // Neonröhren: drei VLights (Intensität 0) + Leuchtkörper nur über Emission
  const rohrM = [0, 1, 2].map(() => new T.MeshStandardMaterial({ color: 0xdfe6ea, emissive: 0xe8f0ff, emissiveIntensity: 0, roughness: .3 }));
  [[-906, 868.2], [-903.2, 869.8], [-900.4, 868.4]].forEach(([x, z], i) => { const r = new T.Mesh(new T.CylinderGeometry(.022, .022, 1.2, 8), rohrM[i]); r.rotation.z = PI / 2; r.position.set(x, R.h - .08, z); VILLA.g.add(r); VILLA.rohr.push(rohrM[i]);
    VILLA.neon.push(villa_licht(x, R.h - .25, z, 0xdde8ff, 0, 8)); });
  // Zellengang: drei Zellen, Zelle Ost gemacht (Bett, Tonband, Liste, Schild)
  await villa_fbx('hospbed', VILLA_SPEC.bed, 0, 'y', -890.2, 867.3, PI / 2, 0, [.008, .008, -.008]);
  await villa_put('radio', 'model.gltf', .36, 'max', -888.6, 868.1, -PI / 2, .45);
  villa_decal(villa_cv(256, 96, (c, w, h) => { c.fillStyle = '#f0ece0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#555'; c.strokeRect(2, 2, w - 4, h - 4); c.fillStyle = '#1a1a1a'; c.font = 'bold 20px "Courier New"'; c.fillText('K-3 · BRANDT, L.', 14, 38); c.font = '15px "Courier New"'; c.fillText('Aufnahme nach Öffnung 2026', 14, 70); }), .34, .13, -890.5, 1.55, 868.72, 0, 0);
  villa_zettel(['Stimmen:', 'Schwester (vorh.)', 'Mutter (Bänder 1975, 2009)', 'Großmutter (verstorben,', '  keine Aufn.)'], .22, .16, -889.2, .62, 867.3, -PI / 2, -PI / 2, { w: 320, h: 230, font: '20px Caveat, cursive' });
  await villa_fbx('chair', VILLA_SPEC.chair, .9, 'y', -888.7, 867.9, -PI / 2);
  villa_hit(.8, .6, .3, -890.5, 1.5, 868.85, 'Schild an der Tür', () => villa_krSchild());
  villa_hit(.5, .5, .5, -888.6, .6, 868.1, 'Tonbandgerät · „Marion 2009“', () => villa_krBand());
  villa_hit(2.1, .7, 1, -890.2, .45, 867.3, 'Das Bett', () => toast('Ein Bett, frisch bezogen. Ein Kopfkissen mit Knick in der Mitte, wie im Hotel. Am Fußende eine Liste in Wolters Schrift. Auf dem Kopfkissen ein Zettel, Schreibmaschine: „Subjekt gilt als kooperativ. Bitte freundlich.“', 6200));
  villa_licht(-890.5, 2.6, 870.3, 0xdde8ff, 0, 7); VILLA.o.zgLicht = VILLA.L[VILLA.Lf - 1]; };

// =====================================================================  UK 1 · „Alle wohlauf“ – Straße bei Tag, Aufräumkommando (AG-11), Zeitung, „Fünf Minuten“
function villa_kapStart() { if (!villa_kap4()) return; if (!villa_S.uk) villa_S.uk = 1; if (typeof kiffen_S !== 'undefined') kiffen_S.auto = false; villa_ziel(); }
// nach dem Klick auf die Intro-Tafel (anwesen.js chapter4Begin)
function villa_nachIntro() { villa_ziel(); setTimeout(() => { try { if (typeof kiffen_start === 'function' && villa_kap4() && !state.talking) kiffen_start(); } catch (e) { console.warn('Villa: Fünf Minuten', e); } }, 6500);
  setTimeout(() => { if (villa_kap4() && !villa_hat('funk_vier') && typeof lwo_funk === 'function') { villa_setz('funk_vier'); lwo_funk('„Vier ist sauber.“', { x: 9, z: -1.3 }); } }, 21000); }
const VILLA_CREW = { b1: { at: [9.8, -.4], ry: PI + .4 }, b2: { at: [22.2, -9.4], ry: PI, weg: [[21.4, -9.6], [23.6, -9.3], [25.6, -9.6]] }, b3: { at: [4.2, -5.6], ry: -PI / 2 } };
function villa_crewAn() { if (VILLA.crew || typeof lwo_figur !== 'function' || typeof LWO === 'undefined' || !LWO.ready) return; VILLA.crew = true;
  for (const k in VILLA_CREW) { const F = lwo_figur(k), C = VILLA_CREW[k]; if (!F) continue; lwo_zeigen(F, C.at[0], C.at[1], C.ry); lwo_lampe(F, false); lwo_clip(F, k === 'b3' ? 'look' : 'idle'); C.i = 0; C.laeuft = false; C.weg2 = 0; } }
function villa_crewAus() { if (!VILLA.crew) return; VILLA.crew = false; for (const k in VILLA_CREW) { const F = lwo_figur(k); if (F) lwo_weg(F); } }
function villa_crewTick() { const P = player.pos;
  const b2 = lwo_figur('b2'), C = VILLA_CREW.b2; if (b2 && b2.g.visible && !C.laeuft && !(typeof LWO !== 'undefined' && LWO.playing)) { C.laeuft = true; C.i = (C.i + 1) % C.weg.length; lwo_gehe(b2, [C.weg[C.i]], .7).then(() => setTimeout(() => { C.laeuft = false; }, 2400 + Math.random() * 2000)); }
  for (const k in VILLA_CREW) { const F = lwo_figur(k); if (!F || !F.g.visible) continue; const d = Math.hypot(P.x - F.g.position.x, P.z - F.g.position.z);
    if (d < 3 && !villa_hat('rueck_' + k) && !state.talking && !(typeof LWO !== 'undefined' && LWO.playing)) { villa_setz('rueck_' + k); F.g.userData.zielYaw = Math.atan2(F.g.position.x - P.x, F.g.position.z - P.z); if (typeof LWO !== 'undefined') LWO.drehen = [F]; lwo_sprich(F, 1600); subtitle('„Anwohner. Männlich.“', 2600, 'ARBEITER'); } }
  if (!villa_hat('ag11') && !state.talking && !ui.overlay && !(typeof LWO !== 'undefined' && LWO.playing) && b2 && b2.g.visible && Math.hypot(P.x - b2.g.position.x, P.z - b2.g.position.z) < 6.5) { villa_setz('ag11');
    lwo_szene('AG-11', { figuren: { A1: b2, A2: lwo_figur('b1') }, at: { x: P.x, z: P.z }, radius: 16 }).then(() => { villa_gedanke('villa_ag11', 'Die Bilder. Er tauscht Hildes Polaroids gegen leere.'); }); } }

// =====================================================================  UK 2 · „Speck ist Speck“ – Nr. 3
async function villa_nr3Klopfen() {
  if (VILLA.busy || state.talking) return; if (!villa_kap4()) return;
  if (villa_hat('lucy')) { Audio.knock(); return villa_geh('nr3', { danach: () => villa_nr3Wieder() }); }
  Audio.knock(); await wait(900);
  await villa_geh('nr3', { vorher: async () => { villa_sperre(true); } });
  if (!villa_hat('lucy')) await villa_nr3Szene(); villa_sperre(false); }
async function villa_nr3Szene() { villa_setz('lucy'); villa_uk(2); const V = (t, ms) => [t, ms, 'VEGAS'], L = (t, ms) => [t, ms, 'LUCY'], U = (t, ms) => [t, ms, 'DU'];
  const A = typeof ch3 !== 'undefined' ? ch3.answer : null; const lucyZ = { A: '„Da drin war ein Mann in Eisen. Der hat die ganze Zeit gerufen. Ich glaub, ich hab ihm gesagt, er soll leiser sein.“', B: '„Sie hat gesagt, dein Bruder kommt jetzt mitspielen. Ich hab gesagt: Mein Bruder spielt nicht. Der arbeitet nachts.“', C: '„Sie hat gesagt, du hast ihr was gezeigt. Sie war ganz … aufgeregt. Wie ein Kind vor Weihnachten. Das war das Schlimmste.“' };
  try { if (VILLA.o.vegas) figuren_play(VILLA.o.vegas, 'talk'); } catch (e) {}
  await villa_says([['Keine Kette diesmal. Vegas macht ganz auf. Schürze mit einer Kuh drauf, den Pfannenwender in der Hand wie eine Waffe.', 4600], V('„Sie schläft. Hat zweimal nach dir gefragt und einmal nach Kakao. Ich hab keinen Kakao. Ich hab Speck.“', 5200),
    V('„Und wenn der Vogel noch einmal durchs Klofenster kommt, gibt’s Rabe.“', 3600),
    ['Vom Sofa her summt jemand im Halbschlaf. Fünf Töne, die aus der Spieluhr. Beim vierten bricht es ab.', 4400], V('„Das macht sie seit heute früh.“', 2600)]); // Story-Prüfung W-2
  try { if (VILLA.o.vegas) figuren_play(VILLA.o.vegas, 'idle2'); if (VILLA.o.lucy) figuren_lookAt(VILLA.o.lucy, camera, 1); } catch (e) {}
  player.yaw = Math.atan2(player.pos.x - (VILLA_R.nr3.x0 + .62), player.pos.z - 857.6);
  await villa_says([['Auf dem Sofa, unter einer Wolldecke: Lucy. Sie ist wach. In ihren Augen, in beiden, sitzt am Rand der Iris ein dünner weißer Ring, wie Frost am Fensterglas.', 5600],
    L('„Großer. Du siehst furchtbar aus.“', 2800), U('„Du hast Weiß in den Augen.“', 2400), L('„Und du hast Ruß im Gesicht. Wollen wir Bilanz ziehen oder willst du mich drücken?“', 4200),
    ['Er drückt sie. Sie friert, obwohl der Ofen bullert. Ihre Hände sind kalt, trocken – aber sie haben Linien. Luke sieht nach. Sie merkt es.', 5200],
    L('„Ich weiß, was du guckst. Ich hab’s auch geguckt. Die sind noch da. Die Linien.“', 4000)]);
  if (lucyZ[A]) await villa_says([L(lucyZ[A], 5200)]);
  await villa_says([['Mehr sagt sie nicht über drinnen. Sie will nicht. Sie hat Hunger.', 3400], ['Vegas kocht. Rührei mit Speck. Das Ei ist grau, der Speck ist schwarz.', 3600], U('„Ist das verbrannt?“', 1800), V('„Das ist Röstaroma.“', 2000), U('„Das ist Kohle.“', 1600), V('„Kohle ist auch ein Aroma.“', 2200),
    ['Bruno liegt an der Tür und sieht zu, ohne Laut. Seinen Napf hat er nicht angerührt.', 3600], V('„Seit er wieder da ist, frisst er keinen Speck. Und er bellt nicht. Bruno hat immer gebellt.“', 5200)]); // Q-9 B-3 / Story-Prüfung Widerspruch 6
  // K4-1: Whiskey durchs Klofenster, auf den Kühlschrank, Vegas' Stimme
  try { if (typeof whiskey_setzen === 'function') whiskey_setzen(VILLA_R.nr3.x1 - .5, 2.05, 856.6); } catch (e) {}
  await wait(1800); try { Audio.play('woodHit2', { gain: .3, rate: 1.4, x: VILLA_R.nr3.x1 - .5, y: 2.05, z: 856.6 }); } catch (e) {}
  let taufe = false; try { if (typeof whiskey_mimic === 'function') taufe = whiskey_mimic('junge', { force: true }); } catch (e) {} // Gag-Budget H-1: „Junge.“ statt eines weiteren „Himmelherrgott!“
  await wait(1400); await villa_says([V('„Sag das nicht mit meiner Stimme!“', 2600), ['Whiskey hat den Speck. Lucy lacht zum ersten Mal, hustet, lacht weiter.', 3800]]);
  if (typeof whiskey_S !== 'undefined') whiskey_S.flags.add('k4_1');
  // Teil 06, falls Kap. 3 es nicht gebracht hat
  if (typeof anwesen_has === 'function' && !anwesen_has(5)) { await villa_says([V('„Seiler. Für den, der fragt. Du bist offenbar der, der fragt.“', 4200)]); anwesen_give(5, 'Vegas drückt es dir in die Hand, ohne Zeremonie. Es lag in einem alten Tabaksbeutel. Ein Stück Eisen mit einem Zahn.'); }
  if (typeof todCheckpoint === 'function') todCheckpoint('k4_sofa', 'Nr. 3 · Sofa'); else saveGame(4);
  void taufe; villa_ziel(); setTimeout(() => villa_ag12Klopfen(), 9000); }
async function villa_lucyNochmal() { if (state.talking) return; const n = (VILLA.lucyN = (VILLA.lucyN || 0) + 1);
  const Z = [['„Ich bleib hier. Vegas passt auf. Sagt er.“', 'LUCY'], ['„Er ist eifersüchtig. Wie du mit neun.“', 'LUCY'], ['„Geh schon. Und komm heim.“', 'LUCY']];
  const z = Z[Math.min(Z.length - 1, n - 1)]; await villa_says([[z[0], 3200, z[1]]]); }
async function villa_vegasNochmal() { if (state.talking) return; if (typeof neben4_vegas === 'function' && await neben4_vegas()) return; const n = (VILLA.vegasN = (VILLA.vegasN || 0) + 1); /* AP-20: Frage nach dem Vogel, Tonband */
  if (n === 1 && typeof whiskey_zoll === 'function' && !(typeof whiskey_S !== 'undefined' && whiskey_S.flags.has('k4_zoll'))) { if (typeof whiskey_S !== 'undefined') whiskey_S.flags.add('k4_zoll');
    await villa_says([['Vegas reicht dir einen Beutel Batterien. Whiskey ist schneller: Drei fallen dir vor die Füße, die vierte behält der Vogel.', 4600]]); whiskey_zoll(); return; }
  const Z = ['„Der Speck ist im Backofen. Eingesperrt.“', '„Er hat den Backofenknopf abgezogen. Der Vogel. Den Knopf!“', '„Ich ess jetzt in der Speisekammer. Tür zu.“'];
  await villa_says([[Z[(n - 2 + Z.length) % Z.length], 3200, 'VEGAS']]); }
async function villa_nr3Raus() { if (VILLA.busy) return;
  if (villa_hat('lucy') && !villa_hat('ag12_lauf')) return villa_ag12Klopfen();
  await villa_geh('draussen', { p: [-27.9, -10.2, PI] });
  if (!villa_hat('bk404')) { villa_setz('bk404'); villa_beob('b_k4_04', { pos: [-30.2, 1.02, -12.35] }); } }
async function villa_nr3Wieder() { const n = (VILLA.nr3N = (VILLA.nr3N || 0) + 1); if (n === 1) await villa_says([['Vegas steht in der Speisekammer, Tür zu. Whiskey sitzt davor und wartet.', 3800]]); }

// =====================================================================  UK 3 · „Wir sind die, die nachts aufbleiben“ – AG-12, Auftrag 1
async function villa_ag12Klopfen() { if (villa_hat('ag12') || villa_hat('ag12_lauf') || VILLA.busy) return; if (VILLA.raum !== 'nr3') return; villa_setz('ag12_lauf');
  const N11 = lwo_figur('n11'), N12 = lwo_figur('n12'); if (!N11 || !N12) { villa_setz('ag12'); villa_ziel(); return; }
  villa_sperre(true); Audio.knock(-981, 1.3, VILLA_R.nr3.z1 + .3); await wait(900);
  await villa_says([['Klopfen an Vegas’ Tür, von draußen. Vegas macht die Kette vor, dann einen Spalt auf.', 3800]]);
  await villa_geh('draussen', { p: [-27.95, -10.5, PI], vorher: async () => { lwo_zeigen(N11, -27.35, -8.55, PI); lwo_zeigen(N12, -28.55, -8.75, PI - .15); lwo_blick(N11, 'luke'); lwo_blick(N12, null); lwo_clip(N12, 'phone');
    if (typeof LWO !== 'undefined') LWO.drehen = null; N11.g.rotation.y = PI; N12.g.rotation.y = PI; } });
  const res = await lwo_szene('AG-12', { figuren: { N11, N12 } });
  // Hildes Heft ansehen (freiwillig) – der Umschlag im hinteren Deckel
  const hatBuch = villa_item('buch'), hatHaus = villa_item('haushaltsbuch');
  if (hatBuch && !villa_hat('bk403')) { const i = await lwo_wahl(['Hildes Heft ansehen', 'Nicht jetzt']); if (i === 0) { villa_setz('bk403'); toast('Im hinteren Deckel klebt ein zugeklebter Umschlag aus Amtspapier. In Hildes Schrift: „Vom Kleinen. Nicht aufmachen.“ Du machst ihn auf.', 5200); await wait(1600); villa_beob('b_k4_03', { vor: true }); await wait(2600); } }
  const opts = [], wege = [];
  if (hatBuch) { opts.push('Hildes Zählbuch geben'); wege.push('echt'); }
  if (hatHaus) { opts.push('Oma Ernas Haushaltsbuch geben'); wege.push('faelschung'); }
  opts.push('„Das Heft gehört Hilde. Und meine Schwester braucht keine Klinik, die braucht Kakao.“'); wege.push('ablehnen');
  opts.push('Nichts sagen. Später.'); wege.push('spaeter');
  let i = await lwo_wahl(opts); if (i < 0) i = opts.length - 1; const weg = wege[i];
  await villa_ag12Weg(weg); void res; villa_sperre(false); }
async function villa_ag12Weg(weg) { const N11 = lwo_figur('n11'), N12 = lwo_figur('n12'), W = typeof LWO_AG12_WEGE !== 'undefined' ? LWO_AG12_WEGE : {};
  const spiel = async list => { if (typeof lwo_schritte === 'function' && list) { const r = { wahl: [], abgebrochen: false, nachher: [] }; await lwo_schritte(list, { figuren: { N11, N12 } }, r); } };
  state.talking = true;
  try {
    if (weg === 'spaeter') { await villa_says([['„Wir warten am Wagen, Herr Brandt. Wir haben Zeit. Wir haben immer Zeit.“', 3800, 'NACHSORGE 11']]); villa_setz('ag12_offen'); }
    else { if (weg === 'echt') { story.items = story.items.filter(k => k !== 'buch'); await spiel(W.echt); villa_trust('auftrag1_echt'); }
      else if (weg === 'faelschung') { story.items = story.items.filter(k => k !== 'haushaltsbuch'); await spiel((W.faelschung || []).slice(0, 5)); }
      else { await spiel(W.ablehnen); villa_trust('auftrag1_ablehnen'); }
      if (typeof lwo_S !== 'undefined') lwo_S.auftrag1 = weg; villa_S.zaehlbuch = weg; villa_setz('ag12'); await spiel(W.abgang);
      if (weg === 'echt') setTimeout(() => villa_beob('b_k4_02b', { pos: [-28, .02, -11.75] }), 4000); }
  } finally { state.talking = false; }
  // Abgang zum Kombi vor Nr. 9
  (async () => { await Promise.all([lwo_gehe(N11, [[-24, -7.8], [20, -7.2], [51.4, -8.9]], 1.2), lwo_gehe(N12, [[-25, -8.2], [20, -7.8], [52.6, -9.3]], 1.15)]);
    if (weg !== 'spaeter') { lwo_weg(N11); lwo_weg(N12); } else { lwo_blick(N11, 'luke'); lwo_clip(N12, 'phone'); } })();
  villa_uk(4); if (weg !== 'spaeter' && typeof todCheckpoint === 'function') todCheckpoint('k4_auftrag', 'Nr. 3 · Gartentor'); villa_ziel();
  setTimeout(() => villa_gedanke('villa_nr9', 'Hinter der Tonne von Nr. 9, hat der Zettel gesagt. Und das Garagentor von Nr. 9 steht einen Spalt offen.'), 5200); }
// „Später“: die beiden warten am Kombi vor Nr. 9 – dort ansprechen; wer vorher in die Villa geht, hat abgelehnt
async function villa_ag12Kombi() { if (!villa_hat('ag12_offen') || villa_hat('ag12') || state.talking) return;
  const opts = [], wege = []; if (villa_item('buch')) { opts.push('Hildes Zählbuch geben'); wege.push('echt'); } if (villa_item('haushaltsbuch')) { opts.push('Oma Ernas Haushaltsbuch geben'); wege.push('faelschung'); }
  opts.push('Ablehnen'); wege.push('ablehnen'); await villa_says([['„Herr Brandt. Haben Sie es sich überlegt?“', 2800, 'NACHSORGE 11']]); let i = await lwo_wahl(opts); if (i < 0) return; villa_S.f.delete('ag12_offen'); await villa_ag12Weg(wege[i]); }
function villa_ag12Verfall() { if (!villa_hat('ag12_offen') || villa_hat('ag12')) return; villa_S.f.delete('ag12_offen'); villa_setz('ag12'); villa_S.zaehlbuch = 'ablehnen'; if (typeof lwo_S !== 'undefined') lwo_S.auftrag1 = 'ablehnen'; villa_trust('auftrag1_ablehnen');
  for (const k of ['n11', 'n12']) { const F = lwo_figur(k); if (F) lwo_weg(F); } }

// =====================================================================  UK 4 · „Das Amt kommt donnerstags“ – Nr. 9
async function villa_nr9Rein() { if (VILLA.busy || state.talking) return;
  await villa_geh('nr9', { danach: () => { if (!villa_hat('nr9')) { villa_setz('nr9'); villa_trust('nr9_betreten'); villa_uk(4);
    setTimeout(() => villa_gedanke('villa_nr9drin', 'Eine Garage. Dahinter ein Wohnzimmer, in dem niemand wohnt.'), 900);
    if (typeof todCheckpoint === 'function') setTimeout(() => todCheckpoint('k4_nr9', 'Nr. 9 · Posten'), 1600); } } }); }
async function villa_nr9Raus() { await villa_geh('draussen', { p: [57.7, -10.9, PI] }); if (villa_hat('ringbuch')) villa_ziel(); }
function villa_nr9Ringbuch() {
  const t = villa_masch('<b>Messstelle Kirchberg · Beobachtung Ahornstraße 7 · ältere Blätter (Auszug)</b>\n14.03. · Objekt tritt nachts auf die Kreuzung. Zählt. Kehrt zurück. Licht aus. Wie immer.\n02.06. · Objekt spricht mit dem Vogel. Der Vogel antwortet. Wortlaut nicht verständlich. N12 vermutet Dialekt.\n09.10. · Objekt trägt nachts Brot in Richtung Hof. Rückweg ohne Brot. Bewertung: harmlos, Alterserscheinung.')
    + '\n\n' + villa_masch('<b>Blatt 212</b>\n23.10., 21:10 · L. B. (26) betritt Nr. 7. Licht Keller. 21:40 · Frau Wendt vor dem Haus, zählt. Acht. 22:05 · L. B. verlässt Nr. 7 nicht.\n24.10. bis 31.10. · Nr. 7 dunkel. Frau Wendt stellt Brot vor die Kellertür. Der Vogel sitzt auf der Laterne.\n03.11., 04:00 · Maas meldet: Anruf aus der Stadt, Bruder. Elfmal nicht abgenommen. Zwölftes Mal: Verbindung.\n04.11., 23:12 · Fahrzeug Ortsschild. Fahrer schläft. Zettel am Fenster (nicht von uns).\n04.11., 23:40 · K-3 betritt den Ort. Zu Fuß. Barfuß? Nein. Nass.')
    + '\n' + villa_hand('Nachtrag zum 23.10., Kugelschreiber: „Frau Wendt legt Brandt, Lucy, in den Tank. Nicht eingreifen. Der Bruder kommt dann von allein. (hw)“') // Story-Prüfung W-5 (Kanon-Änderung, freigegeben)
    + '\n\n' + villa_masch('<b>Blatt 213</b>\n01.11. · Objekt zählt heute neun. Es sind acht. Hinweis an Regionalleitung: Objekt beginnt zu irren. Oder es steht dort tatsächlich ein Neunter. Letzteres ist auszuschließen.') + ' ' + villa_hand('(Zusatz hw: „Nicht auszuschließen.“)')
    + '\n' + villa_masch('03.11. · Objekt zählt. Objekt weint. Protokoll Ende, Schichtwechsel.') + '\n' + villa_blei('IHR ZÄHLT AUCH. ABER FALSCH') + VILLA_SIG
    + '\n\n' + villa_hand('Hinten im Deckel, Kugelschreiber: „Wenn der Bruder kommt, nicht ansprechen. Nur melden. Er soll erst mal laufen. (hw)“');
  villa_note('Ein Ringbuch', t, 'villa_ringbuch', async () => { if (villa_hat('ringbuch')) return; villa_setz('ringbuch'); if (typeof beob_S !== 'undefined') beob_S.found.add('b_k4_n2');
    await villa_says([['<i>Elf Anrufe. Die haben gewartet, dass ich nicht rangeh. Und dann, dass ich komm.</i>', 5200, 'LUKE'], ['<i>Sie haben zugesehen. Monate. Sie haben gesehen, wie Lucy verschwindet, und haben es aufgeschrieben. Sie haben gesehen, wie Hilde weint, und „Schichtwechsel“ druntergeschrieben.</i>', 7200, 'LUKE'], ['„Ihr habt Butterbrotpapier gefaltet.“', 2800, 'DU']]);
    setTimeout(() => { villa_kratzen(-977.6, .9, R9W()); villa_spur('kratzer', { pos: [-977.2, .75, 900.86], ry: PI, n: 3, frisch: true }); }, 2500); }); }
const R9W = () => 900.9;
async function villa_nr9Brett() {
  const html = villa_masch('<b>DA 11</b> (Oktober 2026, Schreibmaschine, frisch)\n„K-3 ist heil. Wiederhole: heil. Bei Sichtkontakt nicht ansprechen, nicht bergen, freundlich bleiben. Abholung Freitag früh. (hw)“')
    + '\n\n' + villa_masch('<b>DA 10 · Abwicklung AST 7 · Archivräume</b>\nZutritt zu Archivräumen der Außenstelle ausschließlich mit Dienstnadel.\nDie Nadel bleibt am Mann. Eine Weitergabe findet nicht statt.\nVerlust ist unverzüglich der Regionalleitung zu melden.') + '\n' + villa_hand('Handschriftlich darunter (Seiler): „Meine behalte ich.“') + '\n\n<small>SEHEN · BERGEN · SCHWEIGEN</small>';
  villa_note('Das Schwarze Brett', html, 'villa_da', async () => { if (villa_hat('da11')) { if (!villa_hat('da10')) villa_da10(); return; } villa_setz('da11'); await villa_says([['„Heil. Die schreiben ‚heil‘, als wär ich ’ne Vase.“', 3200, 'DU']]); villa_da10(); }); }
function villa_da10() { if (villa_hat('da10')) return; villa_setz('da10'); modItem('da10', 'DA 10', 'Dienstanweisung von 2012, graues Papier: „Zutritt zu Archivräumen … ausschließlich mit Dienstnadel. Die Nadel bleibt am Mann.“ Darunter Seiler: „Meine behalte ich.“', 'paper'); addItem('da10'); villa_trust('da10');
  toast('Du nimmst DA 10 mit, ohne zu wissen, wofür.', 3200); }
async function villa_nr9Kamera() { if (state.talking) return; villa_rede(true); villa_sperre(true);
  try { await fade(1, 500); const P = [46.4, 4.3, -12.1], L = [22.5, 1.1, -9.6]; let t = 0; VILLA.kamT = 0; const k = document.body.classList; k.add('cine');
    const cv = renderer.domElement; const f0 = cv.style.filter; cv.style.filter = 'grayscale(.85) contrast(1.15) brightness(1.05)';
    setCamOverride((cam, dt) => { t += dt; cam.position.set(P[0], P[1], P[2]); cam.lookAt(L[0] + Math.sin(t * .2) * .3 + (t > 4 ? (t - 4) * -.9 : 0), L[1], L[2] + (t > 4 ? (t - 4) * .8 : 0)); });
    await fade(0, 500); await wait(3800);
    if (!villa_hat('kamsicht')) { villa_setz('kamsicht'); try { if (typeof beob_sichtung === 'function') beob_sichtung([9.6, 0, 2.6], .9, { weg: [[9.6, 0, 2.6], [10.5, 0, 3.4]] }); } catch (e) {} }
    await wait(3200); await fade(1, 400); setCamOverride(null); cv.style.filter = f0; k.remove('cine'); await fade(0, 500);
    if (villa_hat('kamsicht') && !villa_hat('kamsicht2')) { villa_setz('kamsicht2'); await villa_says([['<i>Die Kamera zeigt Nr. 7 mit Absperrband. Und für eine Sekunde, auf der Kreuzung, trat etwas Weißes hinter die Tonne. Und war weg.</i>', 5400, 'LUKE']]); }
  } finally { setCamOverride(null); villa_rede(false); villa_sperre(false); } }

// =====================================================================  UK 6/7 · Halle (Ergänzungen) und Arbeitszimmer „Asservat 7/58“
// Türen der Halle: anwesen.js legt sie über villa_halleTueren() an (nach dem Hallenbau)
function villa_halleTueren(H) { const x0 = H.x - H.w / 2, x1 = H.x + H.w / 2;
  (async () => { try { for (const [x, z, ry] of [[x0 + .06, 897.6, PI / 2], [x1 - .06, 900, -PI / 2]]) { const m = await msModel('door2'); const o = msGround(msFit(m.clone(true), 2.15, 'y')); o.position.set(x, 0, z); o.rotation.y = ry; o.traverse(q => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); scene.add(o); } } catch (e) { console.warn('Villa: Hallentüren', e); } })();
  const hw = box(.4, 2.2, 1.2, x0 + .25, 1.1, 897.6, hidden, { cast: false }); interact(hw, 'Westtür · Arbeitszimmer', () => villa_geh('az'));
  const ho = box(.4, 2.2, 1.2, x1 - .25, 1.1, 900, hidden, { cast: false }); interact(ho, 'Osttür · Anrichte', () => villa_geh('an'));
  // Wolters Thermoskanne (bleibt nach AG-14 stehen): beim Hallenbau angelegt, unsichtbar, auf dem Schreibtisch an der Ostwand
  (async () => { try { const m = await msModel('w_thermos', 'model.glb'), o = msGround(msFit(m.clone(true), .3, 'y')); o.position.set(x1 - 1.05, .785, H.z - H.d / 2 + 2.2); o.visible = false; scene.add(o); VILLA.o.tee = o;
    const h = box(.3, .4, .3, x1 - 1.05, .98, H.z - H.d / 2 + 2.2, hidden, { cast: false }); interact(h, 'Wolters Thermoskanne', () => villa_teeTrinken()); uninteract(h); VILLA.o.teeHit = h;
    if (villa_hat('ag14')) villa_tee(H); } catch (e) { console.warn('Villa: Thermoskanne', e); } })();
  // Post unter dem Briefschlitz (Z-07)
  try { if (typeof sammeln_platz === 'function') sammeln_platz('Z-07', { x: H.x + .5, y: .03, z: H.z - H.d / 2 + .55, ry: .3, ab: 4, label: 'Post unter dem Briefschlitz' }); } catch (e) {}
  const post = villa_cv(256, 256, (c, w, h) => { c.clearRect(0, 0, w, h); for (let i = 0; i < 16; i++) { c.save(); c.translate(40 + Math.random() * 170, 40 + Math.random() * 170); c.rotate(Math.random() * 6); c.fillStyle = ['#e8e0c8', '#d8d0b8', '#efe8d8', '#c8d0d8', '#e0c8b8'][i % 5]; c.fillRect(-42, -26, 84, 52); c.strokeStyle = 'rgba(0,0,0,.2)'; c.strokeRect(-42, -26, 84, 52); c.fillStyle = 'rgba(40,40,40,.5)'; c.fillRect(-30, -8, 44, 3); c.fillRect(-30, 0, 34, 3); c.restore(); } });
  const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshStandardMaterial({ map: tex(post, true), transparent: true, alphaTest: .05, roughness: .95, polygonOffset: true, polygonOffsetFactor: -2 })); pm.rotation.x = -PI / 2; pm.position.set(H.x + .4, .018, H.z - H.d / 2 + .7); pm.userData.noCol = true; scene.add(pm); }
// Halle: Kratzen in beiden Wänden (S-01) beim ersten Durchqueren
function villa_halleTick() { const A = typeof anwesen_S !== 'undefined' ? anwesen_S : null; if (!A || !A.inHall || villa_hat('hkratz')) return; const H = ANW_HALL;
  if (player.pos.z > H.z + 1.5) { villa_setz('hkratz'); villa_kratzen(H.x + H.w / 2 - .1, .9, H.z - 2); villa_spur('kratzer', { pos: [H.x + H.w / 2 - .12, .8, H.z - 2], ry: -PI / 2, n: 3, frisch: true });
    setTimeout(() => { villa_kratzen(H.x - H.w / 2 + .1, .9, H.z - 1); villa_spur('kratzer', { pos: [H.x - H.w / 2 + .12, .8, H.z - 1], ry: PI / 2, n: 3, frisch: true }); }, 1600); } }
// Krankenbett: Strickjacke, Nachbild (UK 6), Nadel (R4-2)
async function villa_bett() { if (state.talking) return;
  if (!villa_hat('nachbild')) { villa_setz('nachbild'); toast('Ein Krankenbett, zur Treppe gedreht. Über dem Fußende eine graue Strickjacke, die Ellenbogen mit Leder geflickt. In das Kopfteil sind acht Striche geritzt, der achte tiefer als die anderen.', 5600);
    await wait(4200); const ml = typeof figuren_memoryLook === 'function'; try { if (ml) figuren_memoryLook(true); Audio.whisper(player.pos.x + .5, 1.4, player.pos.z, 1.5); } catch (e) {}
    await villa_says([['<i>Seiler im Bett, die Brille mit Pflaster geflickt. Wolter auf dem Stuhl daneben, Hut auf.</i>', 4200], ['„Heinrich. Mach oben das Licht an. Für den, der kommt.“', 3600, 'SEILER'], ['„Es kommt keiner, Theo.“', 2600, 'WOLTER'], ['<i>Wolter steht auf und zieht dem Schlafenden die Decke bis zum Kinn. Dann weiter.</i>', 4200]]);
    try { if (ml) figuren_memoryLook(false); } catch (e) {} await villa_says([['„Bis wohin, Heinrich.“', 2400, 'DU']]); return; }
  if (!villa_item('dienstnadel')) { await villa_says([['Die Strickjacke. In der Innentasche etwas Hartes, eingewickelt in ein Taschentuch mit Monogramm T. S.', 4200]]);
    modItem('dienstnadel', 'Seilers Dienstnadel', 'Silber, das Auge darauf. In ein Taschentuch mit Monogramm T. S. gewickelt. Die Nadel bleibt am Mann.', 'key'); addItem('dienstnadel'); villa_setz('nadel'); villa_uk(8);
    setTimeout(() => villa_gedanke('villa_nadel', 'Am Mann. Am letzten Kleidungsstück, das er getragen hat.'), 800); return; }
  toast('Die Strickjacke. Die Innentasche ist leer.', 2400); }
async function villa_azSchrank() { if (state.talking) return; if (villa_hat('schublade')) return villa_azAkte();
  if (VILLA.sperrSchub && performance.now() < VILLA.sperrSchub) return toast('Die Schubladen sitzen fest. Ein Federriegel. Warten.', 2600);
  const J = ['1941', '1958', '1975', '1992', '2009'];
  openPuzzle(`<h3>AKTENSCHRANK</h3><p>Fünf Schubladen, jede mit einem Messingschild. Daran ein Zettel in Seilers Schrift: <i>„Heinrichs Sachen liegen, wo er stehen geblieben ist. Er selbst weiß es nicht mehr genau. Ich schon.“</i></p><div class="row" style="gap:10px">${J.map((j, i) => `<button data-i="${i}" style="font:22px Georgia;min-width:86px">${j}</button>`).join('')}</div>`,
    box => box.querySelectorAll('button[data-i]').forEach(b => b.onclick = e => { e.stopPropagation(); const i = +b.dataset.i; closeOverlay();
      if (i === 1) { villa_setz('schublade'); try { Audio.play('drawer1', { gain: .5 }) || Audio.play('woodHit1', { gain: .3, rate: .7 }); } catch (e2) {} villa_azAkte(); villa_setz('stuhl'); if (VILLA.o.azStuhl) { VILLA.o.azStuhl.position.z -= .05; VILLA.o.azStuhl.rotation.y = PI - .2; } }
      else { VILLA.sperrSchub = performance.now() + 9000; try { Audio.play('metalHit1', { gain: .12, rate: 2.6 }); } catch (e2) {}
        setTimeout(() => { try { for (let k = 0; k < 3; k++) Audio.play('woodHit1', { gain: .16, rate: 1.9, delay: k * .26, x: player.pos.x, y: 3.2, z: player.pos.z + 1 }); } catch (e3) {} }, 900);
        toast('Die Schublade klemmt. Ein Federriegel schnappt, alle fünf sitzen fest. Im Schrank klingelt ein Glöckchen.', 4200); VILLA.fehlSchub = (VILLA.fehlSchub || 0) + 1;
        if (VILLA.fehlSchub === 2) setTimeout(() => villa_gedanke('villa_r41a', 'Der Mann ist auf jedem Bild. Am Rand. Der sieht 1975 aus wie 2012. Wann hat das angefangen?'), 4400);
        if (VILLA.fehlSchub >= 3) setTimeout(() => villa_gedanke('villa_r41b', 'Herbst jung. Frühjahr so wie heute. Ein Winter dazwischen, und dann nie wieder.'), 4400); } })); }
async function villa_azAkte() { const EISEN = villa_masch('<b>Nachsorge · Akte Subjekt EISEN · angelegt 1958 (H. W.)</b>\nErscheinung: in jeder Öffnung seit mindestens 1941 (eigene Sichtung). Männlich, Rüstung, Helm, Schwert mit Kerbe (2009, Maschine im Messraum). Führt Rückläufer heraus. Spricht wenig, altes Deutsch.\nMaterial der Rüstung: Splitter 1958 gesichert. Substanz S, <b>anorganisch erstarrt</b>. Das Objekt hält ihn offenbar für einen Teil von sich. Er kann drinnen bleiben, solange er will. Wir: Minuten.\nBewertung: Werkzeug des Objekts. Der Hirte, der bestimmt, wer zurückkommt. <b>Nicht ansprechen.</b>')
    + '\n\n' + villa_hand('Handschriftlich, später, Tinte grau: „Er hat mich 1941 herausgeführt. Grete nicht. Ich habe ihn gefragt, warum. Er hat gesagt: ‚Ich finde nie jemanden.‘ Ich glaube ihm nicht. Ich kann es mir nicht leisten, ihm zu glauben.“')
    + '\n\n' + villa_hand('Neben der eingehefteten Seite: „Gefunden 1958 am Rand. Er hat es verloren. Ein Werkzeug schreibt keine Schwüre. Das ist bedauerlich.“')
    + '\n\n<b>Analyse S-7</b> (loses Blatt, angeklammert)\n' + villa_masch('Probe von der Rüstung des Subjekts (Splitter, 1958, im Netz). Reagiert wie ∴-Gewebe, aber tot. Wächst nicht.\nSeiler: „Es ist dasselbe, nur ' + (villa_hat('akte') ? '<u>schläft es</u>' : 'schläft es') + '.“\nVorschlag: Eisenhauben der Bergung nach diesem Vorbild. Abgelehnt, Material nicht beschaffbar.')
    + '\n\nDazu ein Kassenzettel einer Apotheke in der Kreisstadt, 1959: „Wärmflasche, 2 Stück“.';
  villa_note('Schublade „1958“', EISEN, 'villa_eisen', async () => { const erst = !villa_hat('akte'); villa_setz('akte'); villa_uk(7);
    if (erst) { try { if (typeof sammeln_sb === 'function') sammeln_sb(9); } catch (e) {}
      await villa_says([['<i>„Der Hirte, der bestimmt, wer zurückkommt.“ Die halten ihn seit Jahrzehnten für den Hütehund von dem Ding. Und er hat ihre Kinder rausgetragen.</i>', 6200, 'LUKE'], ['<i>Das ist kein Eisen. Das ist dasselbe Zeug wie in ihren Gläsern. Nur eingeschlafen.</i>', 4600, 'LUKE']]);
      if (villa_item('flicken') && !villa_hat('flicken')) { const i = await lwo_wahl(['Den Flicken danebenlegen', 'Nicht jetzt']); if (i === 0) await villa_flicken(); }
      await villa_says([['Er sagt nichts. Er legt die Hand flach auf die Akte EISEN, einen Moment. Dann weiter.', 4200]]);
      if (typeof todCheckpoint === 'function') todCheckpoint('k4_az', 'Villa · Arbeitszimmer'); } }); }
async function villa_flicken() { villa_setz('flicken'); await villa_says([['Du legst den Flicken unter die grüne Lampe, neben das Wort „tot“. Er ist warm, so warm wie in dem Moment, als Justin ihn dir gegeben hat.', 5600],
  ['Auf seiner Innenseite beschlägt er ganz langsam, wie Glas, das jemand anhaucht, und wird wieder klar. Zweimal. Dann nichts mehr.', 5600], ['„Tot, schreibt ihr. Der ist warm.“', 2600, 'DU']]);
  if (!story.lore.some(l => l.key === 'fibel_schiffshaut')) story.lore.push({ key: 'fibel_schiffshaut', title: 'Schiffshaut', html: villa_hand('Seine Rüstung ist aus dem Schiff. Deshalb sieht sie ihn nicht. Er hat gesagt, er muss sie eines Tages ausziehen. Das hier ist das erste Stück.') }); questPop('ABENTEUERFIBEL', 'Schiffshaut'); }
async function villa_azAsservat() { if (villa_hat('sb08')) return toast('Holzwolle, ein Stück Eisennetz, ein Strang sauber durchtrennt.', 2600);
  const i = await lwo_wahl(['Das Siegel brechen', 'Liegen lassen']); if (i !== 0) return; villa_setz('sb08'); villa_trust('siegel_758'); try { Audio.play('woodHit1', { gain: .3, rate: .8 }); } catch (e) {}
  villa_note('ASSERVAT 7/58', 'Das Siegel trägt das Auge. Drinnen, in Holzwolle: ein Stück Eisennetz, ein Strang sauber durchtrennt, als hätte eine sehr scharfe Klinge es geschnitten. Und in einer Klarsichthülle eine Seite.', 'villa_asservat', async () => {
    try { if (typeof sammeln_sb === 'function') sammeln_sb(8); } catch (e) {} await wait(600); await villa_says([['Luke hält das Netz an die Lampe.', 2200], ['„Er hat sie rausgeschnitten. Nur zu spät.“', 3000, 'DU']]); }); }
function villa_azKarte() { if (typeof neben4_karte === 'function') return neben4_karte(); /* AP-20 „Aus aller Welt“ */ villa_note('Die Weltkarte', 'Darüber ein Messingschild: <b>LUCID WORLD ORGANIZATION · AUSSENSTELLEN</b>\n\nNeun Nadeln, jede mit Nummer und Kürzel in Seilers Schrift. Bei der Sieben: ' + villa_hand('„wir.“') + '\n\nDrumherum, mit Stecknadeln: Zeitungsausschnitte, „Aus aller Welt“.', 'villa_weltkarte', async () => {
  if (villa_hat('karte')) return; villa_setz('karte'); try { if (typeof sammeln_z === 'function') sammeln_z(10); } catch (e) {} await wait(400);
  await villa_says([['„Außenstelle sieben. Es gibt also mindestens sechs andere Dörfer, in denen irgendwer ‚Gasleck‘ in die Zeitung schreibt.“', 5200, 'DU']]); }); }
function villa_azFotos() { villa_note('Die Fotowand', 'Sechs Fotos, jedes mit Jahr auf dem Passepartout. Auf allen steht am Rand derselbe Mann im grauen Mantel.\n\n<b>Lehrgang, Herbst 1957</b>: jung und dünn, fast ein Student, die Mütze schief.\n<b>Einweihung der Außenstelle, Frühjahr 1958</b>: ein Mann mit Tränensäcken und Hut, der aussieht, als hätte er einen ganzen Winter lang nicht geschlafen.\n<b>1975 · 1992 · 2009 · 2012</b>: genau so. Immer genau so.\n\nAuf dem Foto von 1992 lacht ein Mann mit Pfeife und Sonnenbrille auf dem Kopf neben einem Hirsch im Gehege. Auf dem Passepartout: „Pell und ‚Buck‘“.', 'villa_fotowand', async () => {
  if (villa_hat('fotos')) return; villa_setz('fotos'); await villa_says([['„Der Einzige hier, der auf einem Foto lacht. Und er hat einen Hirsch dabei.“', 3800, 'DU']]);
  setTimeout(() => { if (!villa_hat('schublade') && VILLA.o.fotos && VILLA.o.fotos[1]) VILLA.o.fotos[1].rotation.z = .12; }, 20000); }); }
function villa_azTisch() { if (villa_hat('w11') && !villa_hat('ring')) return villa_w11Akte();
  villa_note('Auf dem Schreibtisch', 'Unter der grünen Lampe ein kleines Foto von 2012: Seiler, weißhaarig, in einer grauen Strickjacke mit Lederflicken am Ellenbogen. Links auf der Brust eine silberne Nadel mit dem Auge.\n\nRückseite: ' + villa_hand('„Letzter Tag. Die Nadel geb ich nicht ab. T. S.“'), 'villa_nadelfoto', () => { villa_setz('nadelfoto'); if (!villa_item('dienstnadel')) setTimeout(() => villa_gedanke('villa_r42', 'Die Strickjacke. Die liegt in der Halle, auf dem Krankenbett.'), 900); }); }

// =====================================================================  UK 8 · „Eigentum der Bundesstelle“ – Anrichte, Archiv, Heinrichs Zimmer
async function villa_anOben() { if (!villa_item('dienstnadel')) { toast('Statt Klinke ein kleines Messingschild mit einem Schlitz und dem Auge: „Zutritt nur mit Dienstnadel“.' + (villa_hat('da10') ? '' : ' Darunter, klein: „Die Nadel bleibt am Mann.“'), 5200); if (!villa_hat('nadelHin')) { villa_setz('nadelHin'); setTimeout(() => villa_gedanke('villa_nadelhin', 'Eine Nadel. Die bleibt am Mann. Welcher Mann, der ist tot.'), 900); } return; }
  if (villa_hat('ag13_lauf') && !villa_hat('ag13')) return;
  try { Audio.play('switch1', { gain: .4, rate: 1.4 }); } catch (e) {}
  await villa_geh('og', { danach: () => { if (!villa_hat('og1')) { villa_setz('og1'); villa_uk(8); toast('Das Schloss klickt, als hätte es sich gefreut. Die Treppe ist eng und steil, Linoleum. Auf der fünften Stufe drei Batterien, Spitzen nach innen, im Dreieck. Die Stufe darüber ist warm.', 6200);
    if (typeof todCheckpoint === 'function') setTimeout(() => todCheckpoint('k4_archiv', 'Villa · Archiv'), 1200); } } }); }
async function villa_anUnten() { if (!villa_item('dienstnadel')) return toast('Die Kellertür. Dasselbe Messingschild mit dem Schlitz und dem Auge.', 3400);
  if (!villa_hat('ag13')) return villa_gedanke('villa_erstoben', 'Von unten zieht es kalt herauf. Erst will ich wissen, was oben liegt.');
  if (!villa_hat('keller1')) { villa_setz('keller1'); villa_uk(10); try { if (typeof whiskey_kellertreppe === 'function') whiskey_kellertreppe([-885.3, 2.3, 900.4], true); } catch (e) {}
    await villa_says([['Whiskey sitzt oben auf dem Geländer der Kellertreppe, durchs Anrichtefenster hereingeschlüpft, und schreit. Kein Krächzen. Ein Laut, den du von ihm noch nie gehört hast.', 5600], ['Du gehst trotzdem. Der Rabe bleibt oben.', 2800]]); }
  await villa_geh('kr', { danach: () => { if (!villa_hat('kr1')) { villa_setz('kr1'); if (typeof todCheckpoint === 'function') todCheckpoint('k4_keller', 'Villa · Keller', { x: -906, z: 869, yaw: -PI / 2 }); } } }); }
async function villa_ogRunter() { if (villa_hat('ag13_lauf') && !villa_hat('ag13')) return toast('Unten sind Schritte. Nicht jetzt.', 2200);
  await villa_geh('an', { p: VILLA_TUER.anOben });
  if (villa_S.zaehlbuch === 'faelschung' && villa_hat('ag13') && !villa_hat('funkfalsch')) { villa_setz('funkfalsch'); await wait(1200);
    if (typeof lwo_funk === 'function') await lwo_funk('„Nachsorge an alle. Das Heft ist falsch. Der Rückläufer hat uns Kassler gegeben.“', { x: -888, z: 900 }); villa_trust('auftrag1_faelschung'); try { lwo_drohung('faelschung'); } catch (e) {} } }
function villa_ogBestand() { villa_note('Bestandsliste Außenstelle 7', villa_masch('<b>BfR · AST 7 · Bestand (Stand Abwicklung 2012)</b>\nSubstanz S, Dosen · 41 (davon 39 an Nachsorge H. W., persönlich) · verbleibend 2\nGlas ∴-1 · Kühlraum · <b>nicht öffnen</b> · Glas ∴-2 · Kühlraum · leer seit ████ · „Fenster war zu“\nObjekt DREIPUNKT (3) · nicht fixierbar · legt Zettel · Kamera Nr. 9 seit 2012 · 0 Aufnahmen, 611 Zettel\nProbe W (Projekt WENDIGO) · <b>entwichen 13.07.1992</b> · Wirt Hofer · Leiter Pell (seit 1994: s. Probe W)\nProbe T · Weiher Dustwoods · <b>nicht bergen · zieht</b>\nProbe C (der Chor) · 12 Gläser · singen nachts · verlegt nach Außenstelle 3')
  + '\n\n— Blatt 2 —\n' + villa_masch('Kiste 41 · LEBEND · NICHT FÜTTERN · verlegt 2012, Empfänger ████████\nRüstungsfragment (Subjekt EISEN) · 1 Splitter, 1958 · „Substanz S, anorganisch erstarrt“ · Kühlraum\nPorträt („… IRA“, 2043) · Halle · Bewertung: Belichtung künftiger Verbleib · Vorsicht\nKuh (1975) · Kadaver entsorgt · Flanke fotografiert: 7 Kreise, ein halber\nGlocke (1975) · zurück an Kapelle · schwingt in offenen Nächten\nBegleitvogel, beringt · gesichtet 1958, 1975, 1992, 2009 · derselbe Ring · nicht fangbar (beißt, klaut)\nKindersitze · 7 · im Bus · Bus: verlegt Wald (Motorschaden 2009, nie geborgen)\nKühlkette K-3 · vorbereitet · Villa, Zelle Ost · „Bitte freundlich.“') + '\n\n<small>SEHEN · BERGEN · SCHWEIGEN</small>',
  'villa_bestand', async () => { if (villa_hat('bestand')) return; villa_setz('bestand'); await villa_says([['„Zelle Ost. Hier. In diesem Haus.“', 2600, 'DU']]); villa_ag13Check(); }); }
function villa_ogKAkten() { const echt = villa_S.zaehlbuch === 'echt';
  const K1 = villa_masch('<b>BfR · AST 7 · VERSUCHSREIHE K · Fall K-1</b>\nProband: Kranz, Peter · Rückläufer 1975 (Hand: EISEN) · Kenntnisstand: informiert seit Frühjahr 1992 · verwahrt seit 11/1992, Ebene −2, Prüfraum 3.\nZiel: Rückübersetzung. Verbleib Original Kranz, P. (10 J.) ermitteln.\nMittel: Substanz S (oral, 0,5 g/Woche, ab 1996 2 g; Charge 92/3), Lichtreiz, Kälte, Tonträger „Marion 1975“ (Nachsorgeband, 41 Min.), ab 2009 Tonträger „Nichte, 9“ (Nachsorgeband Rückführung).\nErgebnis 41: Proband hält die Hand der Ärztin, sagt „Bruder“. Ergebnis 212: Proband zählt Zähne, bis Blut kommt. Ergebnis 380: Zahnzahl nicht mehr feststellbar.\nBewertung (hw): Umbau nach Fremdbild („der lachende Onkel“), kein Zugang zum Original. Bedauerlich. Weiterführen bis zur Aufnahme K-3.') + '\n' + villa_hand('Vermerk Dr. Brand: „Er weiß, was wir tun. Er weiß es jeden Tag neu. Das ist das Ergebnis. Schreiben Sie das rein.“');
  const K2 = villa_masch('<b>BfR (i. Gr.) · VERSUCHSREIHE K · Fall K-2 (vormals 08/58)</b>\nProband: männlich, ca. 6 J., ohne Namen. Rückläufer 1958 (Hand: EISEN). Von der Familie Rieke nicht angenommen („Das ist nicht mein Hänschen“).\nAugen braun (Original blau), Narbe li. Handfläche, halbrund. Fragt täglich nach „heim“.\nMittel: Substanz S (erste Charge, aus DREIPUNKT-2), Kälte, Bild des Originals (Foto Rieke, 1957).\nVerlauf: Ab 1960 Umbau nach Fremdbild (Bildgeber: Nachbarskind, 4 J., Name geschwärzt; Aussage bei Nachsorge: „so klein wie ein Hänschen“). Das Bild trägt keinen Körper. Verstorben Frühjahr 1961.\nBestattung als Unbekanntes Kind, Kreuzung, 08. Familie nicht informiert. Gez. Dr. T. Seiler.') + '\n' + villa_hand('Randnotiz Seiler, Tinte: „Die Mutter hat ihn nicht genommen. Er hat im Wagen gefragt, wann er heim darf. Ich habe das zugelassen.“') + '\n' + villa_blei('DER ACHTE WAR NICHT ICH') + VILLA_SIG;
  const K3 = echt ? 'Der Umschlag K-3 fehlt. Dafür liegt ein Butterbrotpapier da: ' + villa_hand('„Gerade eben verlegt. Danke. (11)“') : villa_masch('<b>BfR · AST 7 · VERSUCHSREIHE K · Fall K-3 · VORBEREITET</b>\nProband: Brandt, Luke · Rückläufer 08/2009 (Hand: EISEN) · Kenntnisstand: nicht informiert (Stand 10/2026). Aufnahme nach Öffnung 2026, sobald informiert.\nBegründung: K-1 zeigt, dass nur ein informierter Rückläufer als Fährte taugt. K-3 ist der erste Fall mit vollständiger Vorgeschichte (Zwilling verfügbar, Mutter-Bänder, Original „Klar!“-Reaktion 2009 dokumentiert).\nMittel: wie K-1, zusätzlich Tonträger „Schwester, Tank, 10/2026“.\nUnterbringung: Villa (Amt aufgelöst). Grabstelle bestellt. Vermisstenmeldung vorbereitet. Kühn informiert.\nGez. (hw). Nachtrag (hw): „Der Rabe ist wieder da. Derselbe Ring. Vorsicht bei der Aufnahme.“')
    + '\n\n' + villa_hand('Angeheftet, Wolters Beiblatt: „Vollständigster bekannter Rückläufer. Blutgruppe abweichend, Narbe links halbrund, Augen braun (Original blau). Beruf: Tontechniker (Nachtschicht, Fr frei). Subjekt gilt als kooperativ. Bitte ' + (villa_hat('kakten') ? '<u>freundlich</u>' : 'freundlich') + '. Zelle Ost vorbereitet, Kühlkette, Tonband ‚Marion 2009‘. Mit K-3 holen wir sie zurück. Alle.“') + '\n' + villa_hand('<small>Grete.</small>');
  villa_note('Die K-Akten', '<b>K-1</b>\n' + K1 + '\n\n<b>K-2</b>\n' + K2 + '\n\n<b>K-3</b>\n' + K3, 'villa_kakten', async () => { const erst = !villa_hat('kakten'); villa_setz('kakten'); if (typeof beob_S !== 'undefined') beob_S.found.add('b_k4_n1');
    if (erst) { if (echt) setTimeout(() => villa_beob('b_k4_02c', { pos: [VILLA.o.regal['OBJEKT DREIPUNKT'], 1.02, 931.95] }), 600); else await villa_says([['„Die wissen, dass ich freitags frei hab.“', 2800, 'DU']]); }
    villa_ag13Check(); }); }
function villa_ogListen() { villa_note('Regal LISTEN 1958 BIS 2009', 'Vier Mappen, in jeder ein Foto vom Sommerfest des Zyklusjahres. Auf jedem steht am Rand dasselbe blasse Mädchen im weißen Sommerkleid, gleich alt. Auf jedem Foto derselbe Stempel wie im Amt:\n\n' + villa_masch('<b>ERSCHEINUNGSFORM B ANWESEND</b>') + '\n\nAuf der Mappe von 1992, Bleistift: ' + villa_hand('„Kinder vollzählig. Pfarrer fehlt.“'), 'villa_listen', async () => { if (villa_hat('listen')) return; villa_setz('listen');
  await villa_says([['„Erscheinungsform B. Die haben ihr einen Behördennamen gegeben und sie trotzdem jedes Mal eingeladen.“', 4600, 'DU']]); }); }
const VILLA_PELL = ['<b>Eintrag 1 · Zelle W, Station Nord</b>\nProbe W seit heute in der Baracke. Kein Kopf, keine Augen, Gewicht schwankt (!) zwischen 40 und 70 Kilo, je nachdem, wann man wiegt. Steht auf wie ein Hirsch, wenn man es anleuchtet, legt sich hin, wenn man das Licht ausmacht.\nTrupp 3 nennt es „den Sack“. My grandmother would call this a wendigo. Ich schreibe es hier hin, damit es keiner ernst nimmt.\nSeiler will Ergebnisse bis zum Herbst. Ich will erst mal wissen, was es isst.',
  '<b>Eintrag 2 · Was es isst</b>\nEs frisst kein Fleisch. Es hat drei Tage neben dem Kadaver gelegen und ihn nicht angerührt. Dann hat es die Hirschhaut genommen und sich hineingelegt wie in einen Schlafsack.\nEs frisst das, was Seiler „Belichtung“ nennt: die Bilder, die nach einer Öffnung an den Orten hängen. Wir haben es an den Rand der Senke gebracht, und es hat gefressen. Danach war der Rand leer. Seiler konnte dort nichts mehr sehen. Er war sehr still auf dem Rückweg.\nWenn das Objekt von diesen Bildern lebt, haben wir hier die Waffe. Starve it.',
  '<b>Eintrag 4 · Freiwilliger</b>\nHofer hat unterschrieben. Ich habe ihm dreimal gesagt, dass es keinen Rückweg gibt, den wir kennen. Er hat gesagt, er kennt auch keinen, seit siebzehn Jahren nicht. Seiler hat gegengezeichnet, ohne aufzusehen.\nAb dem 2. Juli: Wirt 2, human. Zelle W, Neonring, Tür nur von außen. Hofer nimmt sein Dienstbuch mit. Ich habe es erlaubt. Es soll ihm die Nächte kürzer machen.\nIch schlafe seit einer Woche in der Baracke. Man hört es atmen durch die Wand. Zwei Atemzüge, dann ein dritter, der nicht dazugehört.'];
function villa_ogPell() { const E = VILLA_PELL; // AP-24: Einträge 1, 2, 4 (Lore pell_1, pell_2, pell_4)
  const n = Math.min(3, (VILLA.pellN = (VILLA.pellN || 0) + 1)); const L = [['„Seine Oma hatte ein Wort dafür. Meine hätte ‚Kassler‘ gesagt und es trotzdem gefüttert.“', 4600, 'DU'], ['<i>Es frisst Nachbilder. Das Einzige, was nur ich sehen kann.</i>', 3800, 'LUKE'], null][n - 1];
  villa_note('Karton „W“ · Pells Heft (' + n + ' von 9)', 'Karierte Seiten, Kaffeeringe, Kugelschreiber. Stempel „W“.\n\n' + villa_hand(E[n - 1]), 'villa_pell' + n, async () => { villa_setz('pell' + n); if (typeof n6_pellVilla === 'function') n6_pellVilla(n);
    if (n === 1 && !story.lore.some(l => l.key === 'pell_heft')) { story.lore.push({ key: 'pell_heft', title: 'Pells Heft', html: 'Pells Heft · 3 von 9. Einträge 1, 2 und 4 aus dem Karton „W“ im Archiv der Villa. Die übrigen sechs: irgendwo im Wald.' }); questPop('ABENTEUERFIBEL', 'Pells Heft · 3 von 9'); }
    if (L) await villa_says([L]); if (n < 3) setTimeout(() => toast('Im Karton liegen noch weitere Seiten.', 2200), 400); }); }
function villa_ogDreipunkt() { if (villa_S.zaehlbuch === 'echt' && villa_hat('ag13')) return toast('Das Regal DREIPUNKT ist leergeräumt. Staubränder, wo die Ordner standen.', 3400); toast('OBJEKT DREIPUNKT. Ordner voller Zettel in Druckbuchstaben, jeder in einer Klarsichthülle, jeder mit drei Punkten. Nummeriert bis 611.', 4600); }
function villa_ogFormblatt() { villa_note('Formblatt 8', villa_masch('<b>Einwilligung · Formblatt 8 · Zyklus 2026</b>\n§ 4 …\nPerson: ') + villa_hand('Brandt, L.') + '\n' + villa_masch('Unterschrift der Erziehungsberechtigten: ______________'), 'villa_formblatt8', async () => { if (villa_hat('formblatt')) return; villa_setz('formblatt');
  await villa_says([['„Wer soll das denn unterschreiben. Meine Mutter ist … da drin.“', 3600, 'DU']]); }); }
function villa_ogTeedose() { villa_setz('heinrich'); if (!villa_hat('n4')) { villa_setz('n4'); setTimeout(() => villa_beob('b_k4_n4', { pos: [-886.8, .62, 931.2] }), 800); }
  const hat = villa_S.grete; if (!villa_hat('grete_gesehen')) { villa_setz('grete_gesehen'); villa_S.grete = true; }
  if (typeof neben4_teedose === 'function') { neben4_teedose(hat); villa_ag13Check(); return; } // AP-20 „Der Kreisel, der nicht umfällt“ (Wortlaut, Schreck, Foto ins Album)
  villa_note('Eine Teedose aus Blech', 'Kein Tee darin. Ein Foto, an den Rändern weich gegriffen: ein Junge und ein Mädchen mit Zöpfen auf einer Treppe. Das Mädchen hält einen Blechkreisel. Auf der Rückseite, Bleistift: ' + villa_hand('„Grete und Heinrich.“'), 'villa_grete', async () => {
    if (hat || villa_hat('gretefoto')) return; const i = await lwo_wahl(['Das Foto einstecken', 'Zurücklegen']); if (i !== 0) return; villa_setz('gretefoto');
    try { if (typeof album_abheften === 'function') album_abheften('grete', { bild: villa_cv(300, 360, (c, w, h) => { c.fillStyle = '#d8d0bc'; c.fillRect(0, 0, w, h); c.fillStyle = '#6a6254'; c.fillRect(16, 16, w - 32, h - 70); c.fillStyle = '#2a2622'; c.fillRect(90, 120, 40, 120); c.fillRect(170, 110, 44, 130); c.beginPath(); c.arc(110, 104, 20, 0, 7); c.arc(192, 94, 22, 0, 7); c.fill(); }).toDataURL('image/jpeg', .8), art: 'abzug', serie: 'sonst', notiz: 'Grete und Heinrich', hinten: { stil: 'blei', blei: 'Grete und Heinrich.' } }); } catch (e) { console.warn('Album Grete', e); } }); villa_ag13Check(); }

// =====================================================================  UK 9 · „Stullen?“ – AG-13 Schleichen (Sichtkegel, Atem anhalten, Verstecke)
const VILLA_VERSTECK = { schrank: { p: [-907.3, 929.2], yaw: -PI / 2, text: 'Im Schrank. Durch die Lamellen.' }, vorhang: { p: [-903.4, 927.45], yaw: PI, text: 'Hinter dem Vorhang.' }, bett: { p: [-887.2, 930.8], yaw: PI / 2, text: 'Unter dem Bett.', tief: true } };
function villa_ag13Check() { if (villa_hat('ag13') || villa_hat('ag13_lauf')) return; if (!(villa_hat('kakten') || villa_hat('heinrich'))) return; villa_setz('ag13_lauf'); setTimeout(() => villa_ag13(), 2600); }
function villa_atemUI() { if (VILLA.atmeEl) return VILLA.atmeEl; const css = document.createElement('style');
  css.textContent = `#villaAtem { position: absolute; left: 50%; bottom: 20%; transform: translateX(-50%); text-align: center; opacity: 0; transition: opacity .4s; pointer-events: none; z-index: 5; }
  #villaAtem.show { opacity: 1; } #villaAtem p { margin: 0 0 8px; font: 600 14px "Cormorant Garamond", Georgia, serif; letter-spacing: .3em; color: #e9dfc8; text-shadow: 0 0 2px #000, 0 0 10px #000; }
  #villaAtem b { display: inline-flex; align-items: center; justify-content: center; min-width: 30px; height: 26px; padding: 0 8px; margin-right: 10px; border: 1px solid rgba(201,163,106,.7); border-radius: 3px; background: rgba(8,7,6,.62); color: #f3e7cc; font: 700 12px Georgia, serif; }
  #villaAtem i { display: block; width: 240px; height: 3px; margin: 6px auto 0; background: rgba(201,163,106,.18); } #villaAtem i u { display: block; height: 100%; width: 100%; background: linear-gradient(90deg, #7a9aa8, #d8e6ea); transform-origin: left; }
  #villaAtem s { display: block; width: 240px; height: 3px; margin: 5px auto 0; background: rgba(160,40,30,.18); } #villaAtem s u { display: block; height: 100%; width: 0; background: #b0402c; }
  #villaLamellen { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .6s; z-index: 4; background: repeating-linear-gradient(180deg, rgba(6,5,4,.97) 0 22px, rgba(6,5,4,.55) 22px 27px, rgba(6,5,4,.0) 27px 34px); }
  #villaLamellen.bett { background: linear-gradient(180deg, rgba(6,5,4,.98) 0 58%, rgba(6,5,4,.35) 64%, rgba(6,5,4,0) 70%); } #villaLamellen.vorhang { background: repeating-linear-gradient(90deg, rgba(20,14,10,.9) 0 40px, rgba(20,14,10,.62) 40px 58px); }
  #villaLamellen.show { opacity: 1; }`;
  document.head.appendChild(css); const el = document.createElement('div'); el.id = 'villaAtem'; el.innerHTML = '<p></p><i><u></u></i><s><u></u></s>'; const hud = document.getElementById('hud') || document.body; hud.appendChild(el);
  const lam = document.createElement('div'); lam.id = 'villaLamellen'; hud.appendChild(lam); VILLA.lamEl = lam; VILLA.atmeEl = el; VILLA.atmeBar = el.querySelector('i u'); VILLA.entBar = el.querySelector('s u'); return el; }
function villa_atemHinweis(t, bars) { const el = villa_atemUI(); el.querySelector('p').innerHTML = t || ''; el.querySelector('i').style.display = bars ? 'block' : 'none'; el.querySelector('s').style.display = bars ? 'block' : 'none'; el.classList.toggle('show', !!t); }
addEventListener('keydown', e => { const A = VILLA.ag13; if (!A || !A.versteck || e.code !== 'Space') return; e.preventDefault(); e.stopImmediatePropagation(); A.halten = true; if (typeof keys !== 'undefined') keys.Space = false; }, true);
addEventListener('keyup', e => { const A = VILLA.ag13; if (A && e.code === 'Space') A.halten = false; }, true);
addEventListener('keydown', e => { const A = VILLA.ag13; if (!A || !A.versteck || e.code !== 'KeyE' || e.repeat || ui.overlay) return; e.preventDefault(); e.stopImmediatePropagation(); villa_rauskommen(); }, true);
async function villa_verstecken(art) { const A = VILLA.ag13;
  if (!A) { if (art === 'schrank') return toast('Ein Garderobenschrank. Mäntel, die nach Mottenkugeln riechen. Genug Platz für einen Erwachsenen, wenn er die Luft anhält.', 4200); if (art === 'bett') return villa_ogBettText(); return toast('Ein schwerer Vorhang vor dem Fenster. Er reicht bis auf den Boden.', 3000); }
  if (A.versteck === art) return villa_rauskommen(); const V = VILLA_VERSTECK[art]; A.versteck = art; A.vpos = V.p; player.pos.set(V.p[0], 0, V.p[1]); player.yaw = V.yaw; player.pitch = V.tief ? -.05 : 0; vel.set(0, 0, 0); camY = V.tief ? .45 : 1.6; flashOn = false;
  villa_sperre(true); villa_atemUI(); VILLA.lamEl.className = art === 'schrank' ? 'show' : art === 'bett' ? 'show bett' : 'show vorhang';
  try { Audio.play(art === 'schrank' ? 'doorCreak' : 'paper1', { gain: .25, rate: 1.3, dur: .6 }); } catch (e) {}
  villa_atemHinweis('<b>LEERTASTE</b>Atem anhalten · <b>E</b> raus', true); }
function villa_rauskommen() { const A = VILLA.ag13; if (!A || !A.versteck) return; A.versteck = null; flashOn = true; VILLA.lamEl && VILLA.lamEl.classList.remove('show'); villa_sperre(false); camY = 1.65; villa_atemHinweis(A.phase === 'drin' ? 'Versteck dich.' : '', false); }
function villa_ogBettText() { toast(villa_hat('n4') ? 'Ein schmales Bett, das nie benutzt aussieht. Darunter ist gerade genug Platz.' : 'Ein schmales Bett, das nie benutzt aussieht. Auf dem Kopfkissen liegt etwas Gefaltetes.', 3400); if (!villa_hat('n4')) { villa_setz('n4'); villa_beob('b_k4_n4', { pos: [-886.8, .62, 931.2] }); } villa_setz('heinrich'); villa_ag13Check(); }
async function villa_ag13() {
  const N11 = lwo_figur('n11'), N12 = lwo_figur('n12'), B = lwo_figur('b0'); if (!N11 || !N12 || !B) { villa_setz('ag13'); villa_ziel(); return; }
  const A = VILLA.ag13 = { phase: 'kommen', t: 0, atem: 1, halten: false, ent: 0, versteck: null, still: 0, stillMax: 0, entdeckt: false, fertig: false };
  try { if (typeof beob_still === 'function') beob_still(120); } catch (e) {}
  try { Audio.play('woodSlam1', { gain: .5, rate: .7, x: -896, y: -2, z: 928 }); } catch (e) {}
  await villa_says([['Unten fällt etwas Schweres um. Dann Stimmen, gedämpft, durch zwei Böden.', 3600]]);
  let gehen = Promise.resolve();
  const kommen = async () => { villa_atemHinweis('Versteck dich. Schrank · unter dem Bett · Vorhang.', false); A.phase = 'drin'; await wait(9000);
    try { Audio.play('doorCreak', { gain: .5, x: -896, y: 1.2, z: 927.3 }); } catch (e) {} // sie kommen die Treppe herauf
    lwo_zeigen(N11, -896.2, 927.6, PI); lwo_zeigen(N12, -895.4, 927.5, PI); lwo_zeigen(B, -896.6, 927.4, PI); lwo_lampe(B, true); lwo_clip(N12, 'phone'); lwo_blick(N11, null); lwo_blick(N12, null);
    gehen = Promise.all([lwo_gehe(N11, [[-897.6, 929.3], [-901.6, 930.2]], .8), lwo_gehe(N12, [[-899.4, 928.4], [-899.9, 928.9]], .7), lwo_gehe(B, [[-896.4, 928.4]], .6)]); await gehen; };
  if (villa_S.zaehlbuch === 'ablehnen') setTimeout(() => { if (!A.fertig && !A.entdeckt) lwo_gehe(N11, [[-893.4, 929], [-888.4, 929.8]], .8).then(() => { if (A.versteck === 'bett') villa_says([['Nachsorge 11 setzt sich auf Heinrichs Bett. Die Matratze drückt dir ins Gesicht.', 3800]]); }).then(() => wait(5000)).then(() => { if (!A.fertig) lwo_gehe(N11, [[-893.4, 929], [-900.8, 930]], .8); }); }, 26000);
  const res = await lwo_szene('AG-13', { figuren: { N11, N12 }, abbruch: () => A.entdeckt, hook: async (tu) => {
    if (tu && tu.r && /Mechanik/.test(tu.r)) { await kommen(); return true; }
    if (tu && tu.r && /Schrank geht auf/.test(tu.r)) { try { Audio.play('doorCreak', { gain: .5, x: -907, y: 1.2, z: 930.9, ref: 3 }); for (let i = 0; i < 4; i++) Audio.play('metalHit1', { gain: .06, rate: 2.8, delay: .4 + i * .12, x: -907, y: 1.6, z: 930.9 }); } catch (e) {} await wait(1600); return true; }
    if (tu && tu.r && /Sie essen/.test(tu.r)) { lwo_clip(N11, 'idle'); for (let i = 0; i < 8; i++) { if (A.entdeckt) break; try { const q = N12.g.position, d = Audio.at(q.x, 1.1, q.z, 1.5); if (!Audio.cut) for (let k = 0; k < 4; k++) { const n = Audio.noise(false), bp = Audio.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(2000, 5000); bp.Q.value = 3; n.connect(bp); Audio.env(bp, .12, .01, .05, k * .05, d); n.stop(Audio.ctx.currentTime + .5); } } catch (e) {} await wait(1250); } villa_kratzen(-900, 3.2, 930); await wait(900);
      await lwo_zeile('N11', '„Hast du das gehört?“'); await lwo_zeile('N12', '„Ratten.“'); await lwo_zeile('N11', '„Ratten schreiben nicht.“'); await lwo_zeile('N12', '„Zettel. Bleistift. Drei Punkte. Unleserlich.“', { vorlesen: true }); return true; }
    return false; } });
  if (A.entdeckt) return villa_ag13Entdeckt();
  // W-09: Klingelton vom Fenster, Hand am Schrankgriff, „Himmelherrgott!“ aus dem Garten
  A.phase = 'w09'; await wait(3000); try { if (typeof whiskey_w09 === 'function') whiskey_w09([-903.4, 1.4, 926.6], [-900, 1.5, 921]); } catch (e) {}
  await wait(2600); if (A.entdeckt) return villa_ag13Entdeckt();
  await lwo_zeile('N12', '„Ein Telefon.“'); await lwo_zeile('N11', '„Das war hier drin.“');
  const ziel = A.versteck ? VILLA_VERSTECK[A.versteck].p : [-903, 929.5]; await lwo_gehe(N11, [[ziel[0] + (A.versteck === 'schrank' ? 1.1 : 0), ziel[1] + (A.versteck === 'vorhang' ? 1.1 : A.versteck === 'bett' ? -1.1 : 0)]], .6);
  if (A.versteck === 'schrank') await villa_says([['Die Hand am Griff. Durch die Lamellen der graue Ärmel, zu kurz. Das Handgelenk. Die Uhr.', 4200]]); else await wait(2400);
  if (A.entdeckt) return villa_ag13Entdeckt();
  await wait(1800); await lwo_zeile('N11', '„Der Alte. Was macht der hier?“'); await lwo_zeile('N12', '„Ich schreib’s auf.“'); await lwo_zeile('N11', '„Du schreibst nichts auf, du kommst mit.“');
  A.fertig = true; A.phase = 'weg'; villa_atemHinweis('', false);
  await Promise.all([lwo_gehe(N11, [[-897, 928.6], [-896.2, 927.3]], 1.1), lwo_gehe(N12, [[-896.3, 927.3]], 1.05), lwo_gehe(B, [[-896.6, 927.3]], 1)]); for (const F of [N11, N12, B]) { lwo_lampe(F, false); lwo_weg(F); }
  try { Audio.play('doorCreak', { gain: .4, x: -896, y: 1.2, z: 927.3 }); } catch (e) {}
  const still = Math.max(4, Math.round(A.stillMax)); villa_S.still = still; if (typeof beob_S !== 'undefined') beob_S.stat.stillMax = Math.max(beob_S.stat.stillMax, still);
  await wait(1500); if (A.versteck) villa_rauskommen(); VILLA.ag13 = null; villa_setz('ag13'); villa_uk(9);
  try { if (typeof whiskey_w09Ende === 'function') whiskey_w09Ende(); } catch (e) {}
  villa_beob('b_k4_05', { pos: [-907.1, .02, 931.2] }); if (VILLA.o.schrank2) VILLA.o.schrank2.rotation.y = PI / 2 + .12;
  if (typeof todCheckpoint === 'function') setTimeout(() => todCheckpoint('k4_og', 'Villa · Obergeschoss'), 5000); villa_ziel(); void res; }
async function villa_ag13Entdeckt() { const A = VILLA.ag13; if (!A || A.fertig) return; A.fertig = true; villa_atemHinweis('', false); if (A.versteck) villa_rauskommen(); flashOn = true;
  const N11 = lwo_figur('n11'), N12 = lwo_figur('n12'), B = lwo_figur('b0'); villa_trust('ag13_entdeckt'); villa_setz('entdeckt');
  if (typeof LWO !== 'undefined' && LWO.wahlFin) LWO.wahlFin(-1);
  await wait(400); await villa_says([['Die Schranktür geht auf.', 1800], ['„Ach, da sind Sie ja.“', 2200, 'NACHSORGE 11'], ['„Gefunden.“', 1600, 'NACHSORGE 12'], ['Sie bringen dich höflich in die Halle, eine Hand leicht an deinem Ellenbogen, wie man eine alte Dame über die Straße führt.', 5200]]);
  for (const F of [N11, N12, B]) if (F) { lwo_lampe(F, false); lwo_weg(F); } VILLA.ag13 = null; villa_setz('ag13'); villa_uk(9);
  const H = ANW_HALL; await villa_geh('halle', { p: [H.x - 3, H.z + .5, PI / 2], vorher: async () => { const W = lwo_figur('wolter'); if (W) { lwo_zeigen(W, H.x - H.w / 2 + 1.3, H.z + 1.5, PI / 2); lwo_blick(W, 'luke'); } } });
  await villa_says([['„Man hat Sie gefunden. Das ist bedauerlich. Ich hätte Sie lieber selbst kommen sehen.“', 4600, 'WOLTER'], ['„Sehen Sie es sich an. Dann reden wir.“', 3000, 'WOLTER']]);
  const W = lwo_figur('wolter'); if (W) lwo_weg(W); villa_ziel(); }
function villa_ag13Tick(dt) { const A = VILLA.ag13; if (!A || A.fertig || A.phase === 'kommen') return; const P = player.pos;
  if (A.versteck) { player.pos.set(A.vpos[0], 0, A.vpos[1]); vel.set(0, 0, 0); camY = VILLA_VERSTECK[A.versteck].tief ? .45 : 1.6; }
  const F = [lwo_figur('n11'), lwo_figur('n12'), lwo_figur('b0')].filter(f => f && f.g.visible); if (!F.length) return;
  // ungeschützt im Sichtkegel: Blechmann lang/schmal, 11 breit/kurz, 12 nur direkt vor dem Block
  if (!A.versteck) { const s = (F[0] && lwo_sieht(F[0], { weit: 4.2, winkel: 1.05 })) || (F[1] && lwo_sieht(F[1], { weit: 2.2, winkel: .35 })) || (F[2] && lwo_sieht(F[2], { weit: 9, winkel: .28 }));
    if (s) { A.ent += dt * 1.6; } else A.ent = Math.max(0, A.ent - dt * .25); }
  else { let nah = 99; for (const f of F) nah = Math.min(nah, Math.hypot(f.g.position.x - P.x, f.g.position.z - P.z));
    if (A.halten && A.atem > 0) { A.atem = Math.max(0, A.atem - dt / 16); A.still += dt; A.stillMax = Math.max(A.stillMax, A.still); if (A.atem <= 0) { A.ent += nah < 4 ? .35 : .1; A.still = 0; try { Audio.play('breath1', { gain: .5 }); } catch (e) {} } }
    else { A.still = 0; A.atem = Math.min(1, A.atem + dt * .22); if (nah < 2.6) A.ent += dt * .3 * (1 - Math.min(1, nah / 2.6) * .5); else A.ent = Math.max(0, A.ent - dt * .1); }
    if (VILLA.atmeBar) VILLA.atmeBar.style.transform = `scaleX(${A.atem.toFixed(3)})`; }
  if (VILLA.entBar) VILLA.entBar.style.width = Math.min(100, A.ent * 100).toFixed(1) + '%';
  if (A.ent >= 1 && !A.entdeckt) { A.entdeckt = true; villa_ag13Entdeckt(); } }

// =====================================================================  UK 10 · „Nicht öffnen“ – Kühlraum, R4-3, Höhepunkt A, Zelle Ost, Deckel
async function villa_krRauf() { if (VILLA.hp) return; await villa_geh('an', { p: VILLA_TUER.anUnten });
  try { if (typeof whiskey_kellertreppe === 'function') whiskey_kellertreppe(null, false); } catch (e) {}
  if (villa_hat('zelle') && !villa_hat('pling')) { villa_setz('pling'); await wait(900); try { if (typeof whiskey_mimic === 'function') whiskey_mimic('pling', { force: true }); } catch (e) {} await wait(900); await villa_says([['„Ja. Ich bin wieder aufgetaut. Danke.“', 2800, 'DU']]);
    if (typeof todCheckpoint === 'function') todCheckpoint('k4_anrichte', 'Villa · Anrichte'); } villa_ziel(); }
function villa_krKasten() { if (VILLA.hp) return; if (villa_hat('strom')) return toast('Der Hauptschalter ist oben. Das Netz brummt.', 2400); VILLA.kastenT = VILLA.kastenT || performance.now();
  const N = ['Halle', 'Arbeitszimmer', 'OG', 'Garten/Presse', '(verwischt)', '(verwischt)'], FB = ['rot', 'rot', 'grau', 'blau', 'blau', 'grau'], FC = { rot: '#a02018', grau: '#8a8e90', blau: '#2a4a9a' };
  const sel = VILLA.sich || (VILLA.sich = [null, null, null, null, null, null]);
  const html = () => `<h3>SICHERUNGSKASTEN</h3><p>Sechs Fassungen, jede mit einem farbigen Passring. Auf dem Boden davor drei Schraubsicherungen im Dreieck: <b style="color:${FC.rot}">rot</b>, <b style="color:#b8bcbe">grau</b>, <b style="color:#5a7ad0">blau</b>. Jede passt nur in ihre Farbe.</p>
    <div class="row" style="gap:10px;flex-wrap:wrap;justify-content:center">${N.map((n, i) => `<button data-i="${i}" style="min-width:132px;border:2px solid ${FC[FB[i]]};font:15px Georgia">${i + 1} · ${n}<br><small>${sel[i] ? '● ' + sel[i] : '○ leer'}</small></button>`).join('')}</div>
    <div class="row" style="margin-top:14px"><button id="vkHaupt">HAUPTSCHALTER</button></div><p class="small"><i>„Nie mehr als drei gleichzeitig.“</i></p>`;
  const bind = box => { box.querySelectorAll('button[data-i]').forEach(b => b.onclick = e => { e.stopPropagation(); const i = +b.dataset.i, f = FB[i];
      if (sel[i]) sel[i] = null; else { const j = sel.indexOf(f); if (j >= 0) sel[j] = null; sel[i] = f; } try { Audio.play('switch1', { gain: .25, rate: 1.6 }); } catch (e2) {} box.innerHTML = html(); bind(box); });
    box.querySelector('#vkHaupt').onclick = e => { e.stopPropagation(); closeOverlay(); villa_krHaupt(sel); }; };
  openPuzzle(html(), bind);
  if (!villa_hat('h2') && performance.now() - VILLA.kastenT > 80000) { villa_setz('h2'); villa_beob('b_k4_h2', { pos: [-898.6, .02, 866.9] }); } }
async function villa_krHaupt(sel) { if (VILLA.hp) return; try { Audio.play('switch1', { gain: .6, rate: .7 }); } catch (e) {}
  VILLA.halleStrom = sel[0] === 'rot'; if (sel[3] === 'blau') { setTimeout(() => { try { for (let k = 0; k < 3; k++) Audio.play('metalHit2', { gain: .3, rate: .5, delay: k * .5, x: -905, y: 2, z: 872 }); } catch (e) {} }, 400); villa_setz('presseLeer'); }
  if (sel[2] === 'grau' && VILLA.o.ogLicht) VILLA.o.ogLicht.intensity = .6;
  if (sel[4] === 'blau' && sel[5] === 'grau') { villa_setz('strom'); return villa_hoehepunktA(); }
  const n = VILLA.kastenFehl = (VILLA.kastenFehl || 0) + 1;
  if (n === 1) villa_gedanke('villa_r43a', 'Farbige Ringe. Die Sicherungen haben auch Farben. Die passen nicht überall.');
  else if (n === 2) villa_gedanke('villa_r43b', 'Vier Schilder kann ich lesen. Zwei nicht. Aber ich weiß, welche Farben übrig sind.');
  else { toast('An der fünften und sechsten Fassung: drei frische Kratzer.', 3000); if (!villa_hat('h2')) { villa_setz('h2'); villa_beob('b_k4_h2', { pos: [-898.6, .02, 866.9] }); } } }
// Höhepunkt A (Kern §12.1, Kinotabelle Teil A, ~46 s): nur Intensitäten vorhandener Lichter, Kamera weich zum Glas geführt
async function villa_hoehepunktA() { const G = VILLA.glas, R = VILLA_R.kr; VILLA.hp = { t: 0, w: 0, ziel: new THREE.Vector3(-903.6, VILLA.o.tischY + .45, 868.8), nah: 0 }; villa_sperre(true); state.talking = true;
  if (typeof todCheckpoint === 'function') todCheckpoint('k4_kasten', 'Villa · Keller', { x: -899.2, z: 867.3, yaw: PI / 2, quiet: true });
  const neon = (i, v) => { const L = VILLA.neon[i]; if (L) L.intensity = v; if (VILLA.rohr[i]) VILLA.rohr[i].emissiveIntensity = v * 1.6; };
  const alle = v => { for (let i = 0; i < 3; i++) neon(i, v); };
  const klopf = setInterval(() => { try { Audio.play('woodHit1', { gain: .35, rate: 1.4, x: player.pos.x, y: 3.4, z: player.pos.z }); } catch (e) {} }, 2000);
  setCamOverride((cam, dt) => { const H = VILLA.hp; if (!H) return; H.t += dt; if (!(H.w > 0)) return; VILLA.v[0].copy(H.ziel).sub(cam.position); const d = VILLA.v[0].length(); if (!(d > .3) || !isFinite(d)) return;
    VILLA.v[0].multiplyScalar(1 / d); VILLA.v[1].copy(cam.position).addScaledVector(VILLA.v[0], Math.min(H.nah || 0, d - .3)); VILLA.dummy.position.copy(VILLA.v[1]); VILLA.dummy.lookAt(H.ziel);
    VILLA.q.copy(cam.quaternion).slerp(VILLA.dummy.quaternion, Math.min(1, H.w)); if (!isFinite(VILLA.q.x + VILLA.q.y + VILLA.q.z + VILLA.q.w) || !isFinite(VILLA.v[1].x + VILLA.v[1].y + VILLA.v[1].z)) { if (!VILLA.nanLog) { VILLA.nanLog = 1; console.warn('Villa: Kamera NaN', H.ziel.toArray(), cam.position.toArray(), H.w, H.nah); } return; }
    cam.position.copy(VILLA.v[1]); cam.quaternion.copy(VILLA.q); });
  const H = VILLA.hp;
  try {
    for (let i = 0; i < 2; i++) { flashOn = false; await wait(110); flashOn = true; await wait(260); }
    await wait(2400); try { Audio.play('switch1', { gain: 1, rate: .5 }); } catch (e) {} await wait(900);
    flashOn = false; clearInterval(klopf); try { if (typeof whiskey_kellertreppe === 'function') whiskey_kellertreppe(null, false);  } catch (e) {} await wait(2000);
    let brumm = null; try { villa_brumm(.6, 2, 50); brumm = Audio.loop('machine1', { gain: .16, fadeIn: 1.5, x: -905, y: .6, z: 866.4, ref: 3 }); } catch (e) {} await wait(2000);
    for (const [i, ms] of [[0, 420], [-1, 260], [0, 160], [1, 380], [2, 300]]) { if (i >= 0) { neon(i, 1.8); try { const q = (VILLA.neon[i] || { position: H.ziel }).position; Audio.play('switch1', { gain: .3, rate: 2.2, x: q.x, y: q.y, z: q.z }); } catch (e) {} } else neon(0, 0); await wait(ms); } alle(1.7);
    await wait(700); await villa_says([['„Okay. Okay. Licht.“', 2200, 'DU']]);
    for (let k = 0; k <= 20; k++) { H.w = k / 20 * .85; await wait(90); }
    await wait(2200); villa_blase(); try { Audio.play('waterFlow', { gain: .12, dur: .8, x: -903.6, y: 1.2, z: 868.8 }); } catch (e) {} await wait(1600);
    alle(.35); await wait(500); alle(1.7);
    for (let k = 0; k <= 30; k++) { H.nah = k / 30 * .2; if (G.milch) G.milch.opacity = .5 + .25 * Math.sin(k / 30 * PI); if (G.fig) G.fig.position.x = Math.sin(k * .5) * .03; await wait(100); }
    await wait(2000);
    try { villa_brumm(.9, 3, 41); } catch (e) {} alle(2.6);
    const f0 = G.fig0; for (let k = 0; k <= 30; k++) { if (G.fig) { G.fig.rotation.y = f0.ry + k / 30 * PI; G.fig.rotation.x = f0.rx + k / 30 * .6; } await wait(100); }
    for (let k = 0; k <= 20; k++) { if (G.fig) { G.fig.position.x = k / 20 * .12; G.fig.position.z = 0; } await wait(100); } try { Audio.play('scrape3', { gain: .35, rate: 2.4, dur: 1.2, x: -903.3, y: 1.3, z: 868.8 }); } catch (e) {}
    await wait(1400); alle(0); try { villa_brumm(0); if (brumm) brumm.stop(.05); } catch (e) {} H.w = .85;
    await wait(2200); for (let k = 0; k < 3; k++) { try { Audio.play('woodHit1', { gain: .7, rate: .9, x: -903.3, y: 1.2, z: 868.8, ref: 2 }); } catch (e) {} await wait(2000); }
    if (G.fig) { G.fig.rotation.set(f0.rx, f0.ry, f0.rz); G.fig.position.set(0, .36, 0); } if (G.fleck) G.fleck.material.opacity = .8; if (G.milch) G.milch.opacity = .5;
    alle(1.7); try { brumm = Audio.loop('machine1', { gain: .12, fadeIn: .3, x: -905, y: .6, z: 866.4, ref: 3 }); VILLA.kompressor = brumm; } catch (e) {} await wait(2600);
    for (let k = 0; k <= 12; k++) { H.w = .85 * (1 - k / 12); H.nah = .2 * (1 - k / 12); if (G.fleck) G.fleck.material.opacity = .8 * (1 - k / 12); await wait(120); }
    await wait(1200); villa_schleuse(true); await wait(700); await villa_says([['„Scheiße. Scheiße.“', 2200, 'DU']]);
  } catch (e) { console.error('Höhepunkt A', e); } finally { clearInterval(klopf); setCamOverride(null); VILLA.hp = null; state.talking = false; villa_sperre(false); flashOn = true; 
    if (VILLA.o.zgLicht) VILLA.o.zgLicht.intensity = 1.2; villa_setz('hoehepunktA'); villa_ziel(); } }
// Netzbrummen (eigene Oszillatoren, feste Werte; ersetzt kino_brumm außerhalb einer Kinosequenz)
function villa_brumm(level, sec = 1, f = 50) { const A = Audio; if (!A.ctx) return; const c = A.ctx, t = c.currentTime; let B = VILLA.brumm;
  if (!B) { if (!(level > 0)) return; const g = c.createGain(), lp = c.createBiquadFilter(); g.gain.value = 0; lp.type = 'lowpass'; lp.frequency.value = 260; lp.connect(g); g.connect(A.master);
    const os = [[f, 'sawtooth', .5], [f / 2, 'sine', .9], [f * 2.01, 'sine', .3]].map(([fr, ty, a]) => { const o = c.createOscillator(), og = c.createGain(); o.type = ty; o.frequency.value = fr; og.gain.value = a; o.connect(og); og.connect(lp); o.start(); return o; }); B = VILLA.brumm = { g, os }; }
  else B.os.forEach((o, i) => { o.frequency.setValueAtTime([f, f / 2, f * 2.01][i], t); });
  const G = B.g.gain; G.cancelScheduledValues(t); G.setValueAtTime(G.value || 0, t); G.linearRampToValueAtTime(Math.max(0, level) * .2, t + Math.max(.05, sec));
  if (!(level > 0)) { const b = B; VILLA.brumm = null; b.os.forEach(o => { try { o.stop(t + sec + .1); } catch (e) {} }); } }
function villa_blase() { const s = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xffffff, transparent: true, opacity: .7, depthWrite: false })); s.scale.setScalar(.035); s.position.set(-903.55, VILLA.o.tischY + .1, 868.75); VILLA.g.add(s);
  let t = 0; const iv = setInterval(() => { t += .05; s.position.y += .012; s.material.opacity = .7 * (1 - t / 2.4); if (t > 2.4) { clearInterval(iv); VILLA.g.remove(s); s.material.dispose(); } }, 50); }
function villa_schleuse(auf) { const S = VILLA.o.schleuse, C = VILLA.o.schleuseCol; if (!S) return; try { Audio.slide(-898, 870.2); } catch (e) {}
  let k = 0; const iv = setInterval(() => { k = Math.min(1, k + .06); S.position.z = 870.2 + (auf ? k : 1 - k) * 1.2; if (k >= 1) clearInterval(iv); }, 30);
  if (auf) { C.minX = C.maxX = -9999; } else Object.assign(C, VILLA.o.schleuseCol0); }
function villa_krGlas1() { if (!villa_hat('hoehepunktA')) return villa_note('∴-1', 'Voll, trüb, eine Flüssigkeit wie verdünnte Milch. Darin, zusammengekrümmt, etwas Kleines, Weißes. Man sieht nicht viel. Man sieht drei Finger, die innen an der Scheibe liegen.\n\nRund um das Glas ist die Scheibe außen verschmiert, in Kinderhöhe, als hätte jemand lange die Stirn daran gelegt. Von dort führen nasse Abdrücke über die Fliesen, klein, dreizehig, bis unter das Lüftungsfenster. Das Fenster ist zu. Die Abdrücke sind noch nass.', 'villa_glas1');
  if (villa_hat('deckel')) return toast('Der Deckel liegt neben dem Glas, so ordentlich wie der andere. Es riecht nach Milch und gemähtem Gras.', 3600);
  if (!villa_hat('bk406')) return toast('Das Glas tut nichts. Solange du hinsiehst.', 2400);
  lwo_wahl(['Den Eisenbügel lösen und den Deckel abnehmen', 'Nicht anfassen']).then(async i => { if (i !== 0) return; villa_sperre(true); state.talking = true;
    try { for (let k = 0; k < 3; k++) { try { Audio.play('metalHit2', { gain: .25, rate: .6 + k * .1 }); Audio.play('scrape3', { gain: .2, rate: 1.2, dur: .6 }); } catch (e) {} await wait(900); }
      const d = VILLA.glas.deckel1; if (d) d.position.set(-.55, .02, .12); if (VILLA.glas.buegel) VILLA.glas.buegel.visible = false;
      villa_setz('deckel'); villa_S.kuehl = true; villa_trust('kuehl_deckel'); await villa_says([['Es riecht nach Milch und nach gemähtem Gras. Mehr passiert nicht, solange du hinsiehst.', 4200], ['„So. Mehr kann ich nicht.“', 2400, 'DU']]);
    } finally { state.talking = false; villa_sperre(false); } }); }
function villa_krSplitter() { toast(villa_hat('flicken') ? 'Ein grauer Splitter: „Subjekt EISEN, Rüstung, 1958“. Du hältst den Flicken daneben. Beide gleich grau. Nur der Flicken ist warm. Das leere Glas beschlägt kurz von innen, als hätte jemand darin ausgeatmet.' : 'In einer Nierenschale ein grauer Splitter mit Schildchen: „Subjekt EISEN, Rüstung, 1958“.', 5600); }
function villa_krSchild() { if (villa_hat('schild')) return toast('K-3 · BRANDT, L. · Aufnahme nach Öffnung 2026', 2400); villa_setz('schild');
  villa_note('Einschubschild', villa_masch('<b>K-3 · BRANDT, L.</b>\nAufnahme nach Öffnung 2026') + '\n\nAuf dem Deckel der Liste am Fußende, Wolters Schrift: ' + villa_hand('„Stimmen: Schwester (vorh.), Mutter (Bänder 1975, 2009), Großmutter (verstorben, keine Aufn.)“') + '\n\nAuf dem Kopfkissen, Schreibmaschine: ' + villa_masch('„Subjekt gilt als kooperativ. Bitte freundlich.“'), 'villa_zelle', () => {
    villa_setz('zelle'); villa_uk(10); setTimeout(() => { villa_says([['Auf der frisch bezogenen Matratze, genau in deiner Länge, eine Kuhle, als hätte schon jemand zur Probe darin gelegen.', 4800]]); villa_beob('b_k4_07', { pos: [-890.2, .62, 867.3] }); }, 900);
    setTimeout(() => villa_beob('b_k4_06', { pos: [-907.2, .02, 869.6] }), 16000); if (typeof todCheckpoint === 'function') setTimeout(() => todCheckpoint('k4_zelle', 'Villa · Zelle Ost'), 6000); villa_ziel(); }); }
async function villa_krBand() { if (state.talking) return; state.talking = true; try { Audio.play('switch1', { gain: .5 }); Audio.tape && Audio.tape(true); } catch (e) {}
  try { await wait(900); await villa_says([['„Luke, Schatz, du musst keine Angst haben. Die Leute hier sind nett. Mama wartet draußen.“', 5600, 'MAMA (BAND)']]); await wait(1200); try { Audio.play('switch1', { gain: .5 }); Audio.tape && Audio.tape(false); } catch (e) {}
    await villa_says([['„Sie hat draußen gewartet. Und dann ist sie reingegangen.“', 3600, 'DU']]); } finally { state.talking = false; } }

// =====================================================================  UK 11 · „Das ist bedauerlich“ – AG-14 Wolter, Höhepunkt B (W-10)
async function villa_ag14() { if (villa_hat('ag14') || villa_hat('ag14_lauf')) return; const W = lwo_figur('wolter'), H = ANW_HALL; if (!W) { villa_setz('ag14'); return; } villa_setz('ag14_lauf');
  const x0 = H.x - H.w / 2; lwo_zeigen(W, x0 + 1.25, H.z + 1.3, PI / 2); lwo_blick(W, 'luke'); lwo_hand('glove');
  villa_sperre(true); await wait(300);
  player.yaw = Math.atan2(player.pos.x - W.g.position.x, player.pos.z - W.g.position.z);
  await villa_says([['Der Stromstoß hat das ganze Haus aufgeweckt. Das Radio auf dem Schreibtisch rauscht.' + (villa_hat('presseLeer') ? ' Draußen hat die Presse dreimal ins Leere gestampft.' : ''), 4200],
    ['Unter dem Porträt steht Heinrich Wolter. Hut auf, Handschuhe an, die Thermoskanne auf dem Buffet neben den heruntergebrannten Kerzen. Whiskey sitzt oben auf dem Geländer der Galerie, still.', 6200]]);
  try { if (typeof whiskey_w10 === 'function') VILLA.w10 = whiskey_w10([H.x + 1.2, 4.3, H.z + H.d / 2 - 1.4], [H.x + 3.8, 1.5, H.z + 3.4]); } catch (e) {}
  const res = await lwo_szene('AG-14', { figuren: { W }, bed: b => b === 'entdeckt' ? false : b === 'dunkel' ? !VILLA.halleStrom : b === 'grete' ? !!villa_S.grete : b === 'gretefoto' ? villa_hat('gretefoto') : b === 'kanne' ? villa_item('thermoskanne') : false,
    hook: async (tu) => {
      if (tu === 'zaehlbuch') { const w = villa_S.zaehlbuch || 'ablehnen', L = (typeof LWO_AG14_ZAEHLBUCH !== 'undefined' ? LWO_AG14_ZAEHLBUCH : {})[w === 'spaeter' ? 'ablehnen' : w]; if (L && typeof lwo_schritte === 'function') await lwo_schritte(L, { figuren: { W } }, { wahl: [], nachher: [] }); return true; }
      if (tu === 'griff') { await villa_hoehepunktB(W); return true; }
      if (tu === 'handschuhWeg' || tu === 'whiskeyHandschuh' || tu === 'beideAugen') return true;
      if (tu === 'trust:grete_foto') { villa_trust('grete_foto'); return true; }
      return false; } });
  villa_trust('ag14_ruhig'); void res;
  if (typeof lwo_S !== 'undefined' && lwo_S.seen.ag14_kanne !== undefined) villa_S.kanne = true;
  await lwo_gehe(W, [[H.x - 1, H.z - 3], [H.x, H.z - H.d / 2 + .8]], .85); lwo_weg(W); try { Audio.play('ironDoor', { gain: .3, rate: .8, x: H.x, y: 1.2, z: H.z - H.d / 2 }); } catch (e) {}
  villa_setz('ag14'); villa_uk(11); villa_sperre(false); villa_tee(H);
  await villa_says([['Er geht. Nicht schnell. Die Thermoskanne bleibt auf dem Buffet stehen. Draußen steigen zwei in den Kombi. Nachsorge 12 winkt dir durchs Fenster zu, mit einer Stulle.', 6200]]);
  if (typeof todCheckpoint === 'function') todCheckpoint('k4_halle2', 'Villa · Halle, später');
  // B-K4-08 (und bei offenem Deckel B-K4-06b) am Villentor – erst, als der Motor weg ist
  setTimeout(() => { villa_beob('b_k4_08', { pos: [-126.6, .02, 56.2] }); if (villa_S.kuehl) villa_beob('b_k4_06b', { pos: [-126.2, .02, 55.8] }); }, 2000);
  setTimeout(() => villa_w11Ruf(), 9000); villa_ziel(); }
// Wolters Thermoskanne bleibt auf dem Buffet (Oberkante per Strahl gemessen); Tee: zehn Minuten keine Kälte-Effekte, ein Gedanke
async function villa_tee(H) { const o = VILLA.o.tee; if (!o || o.visible) return; o.visible = true; interactables.push(VILLA.o.teeHit); }
function villa_teeTrinken() { if (villa_hat('tee')) return toast('Die Kanne ist leer.', 2000); villa_setz('tee'); toast('Tee, grau. Du trinkst.', 1800); setTimeout(() => subtitle('Schmeckt nach Zahnarzt. Und nach … nein. Nicht drüber nachdenken.', 4200, 'LUKE'), 1900); }
async function villa_hoehepunktB(W) { const H = ANW_HALL; const hand = new THREE.Vector3();
  let tgt = null; W.g.traverse(o => { if (!tgt && o.isBone && /LeftHand$|LeftHand_|mixamorigLeftHand/i.test(o.name)) tgt = o; });
  const wo = () => { if (tgt) tgt.getWorldPosition(hand); else hand.set(W.g.position.x + .3, 1.1, W.g.position.z + .2); return hand; };
  let w = 0; setCamOverride((cam) => { const p = wo(); if (!isFinite(p.x + p.y + p.z) || p.distanceTo(cam.position) < .2) return; VILLA.dummy.position.copy(cam.position); VILLA.dummy.lookAt(p); VILLA.q.copy(cam.quaternion).slerp(VILLA.dummy.quaternion, w); if (isFinite(VILLA.q.x + VILLA.q.y + VILLA.q.z + VILLA.q.w)) cam.quaternion.copy(VILLA.q); });
  try { await villa_says([['„Kommen Sie.“', 1600, 'WOLTER']]); { const dx = W.g.position.x - player.pos.x, dz = W.g.position.z - player.pos.z, d = Math.hypot(dx, dz) || 1; if (d > 1.2) lwo_gehe(W, [[player.pos.x + dx / d * 1.05, player.pos.z + dz / d * 1.05]], .35); }
    for (let k = 0; k <= 10; k++) { w = k / 10 * .7; await wait(60); }
    try { const p = wo(); Audio.play('wingFlap', { gain: 1, x: p.x, y: p.y, z: p.z }) || Audio.caw(p.x, p.y, p.z); } catch (e) {}
    if (VILLA.w10) VILLA.w10.schlag(); try { const p = wo(); Audio.play('scrape3', { gain: .5, rate: 2.2, dur: .3, x: p.x, y: p.y, z: p.z }); } catch (e) {}
    lwo_hand('bare'); await wait(300); 
    let sirr = null; try { const c = Audio.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.value = 7200; g.gain.value = .015; o.connect(g); g.connect(Audio.master); o.start(); sirr = { o, g }; } catch (e) {}
    for (let k = 0; k <= 10; k++) { w = .7 + k / 10 * .3; await wait(50); } await wait(2600);
    try { if (sirr) { sirr.g.gain.setTargetAtTime(0, Audio.ctx.currentTime, .3); sirr.o.stop(Audio.ctx.currentTime + 1.2); } } catch (e) {}
    await wait(1400);
  } finally { setCamOverride(null); } void H; }
// =====================================================================  UK 12 · „Das war kein Fahrrad“ – W-11 Ring, die Noten hinter dem Porträt
function villa_w11Ruf() { if (villa_hat('w11')) return; villa_setz('w11'); try { if (typeof whiskey_w11 === 'function') VILLA.w11 = whiskey_w11([-917.1, .95, 899.25]); } catch (e) {} subtitle('„Kum!“', 2600, 'WHISKEY'); villa_uk(12); villa_ziel(); }
function villa_w11Akte() { villa_note('Objekt LICHTSCHIFF · Anlage 14 · Begleitvogel', villa_masch('Corvus, adult, beringt (Eisen, links, Prägung: Turm/Abgrund). Gesichtet bei jeder Öffnung seit Einrichtung der Außenstelle: 1958, 1975, 1992, 2009. Derselbe Ring. Dasselbe Tier (Federprobe 1975 = Federprobe 2009).\nVerhalten: meidet Personal, sucht Nähe zu Rückläufern und zu Subjekt EISEN. Fängt sich nicht. Netz 1958: gestreift, entkommen.\nBewertung (hw): Kein Tier. Ein ') + '<b>' + villa_masch('Werkzeug') + '</b>' + villa_masch(' des Objekts. Bei Sichtung melden. Nicht schießen: Subjekt EISEN reagiert.'), 'villa_begleitvogel', async () => {
  if (villa_hat('ring')) return; state.talking = true; villa_sperre(true);
  try { await villa_says([['Whiskey legt etwas auf das Papier, genau auf das Wort „Werkzeug“: einen kleinen silbernen Ring. Einen halben Mond, für eine Frauenhand.', 5600], ['Du nimmst ihn. Du siehst deine linke Handfläche an, die halbrunde Narbe, den „Fahrradunfall“. Du legst den Ring auf die Narbe. Er passt. Genau.', 6400]]);
    if (VILLA.w11 && VILLA.w11.ring) VILLA.w11.ring(); else { modItem('miras_ring', 'Miras Ring', 'Ein halber Mond. Whiskey hat ihn gebracht. Er passt in meine Narbe, als wär die Narbe dafür gemacht. Sie ist dafür gemacht.', 'key'); addItem('miras_ring'); }
    villa_setz('ring'); if (typeof anwesen_S !== 'undefined') anwesen_S.seen.add('ring');
    await villa_says([['„Das war kein Fahrrad.“', 2600, 'DU'], ['Whiskey sitzt da und putzt sich nicht.', 2600]]);
    if (!story.lore.some(l => l.key === 'fibel_miras_ring')) story.lore.push({ key: 'fibel_miras_ring', title: 'Miras Ring', html: villa_hand('Ein halber Mond. Whiskey hat ihn gebracht. Er passt in meine Narbe, als wär die Narbe dafür gemacht. Sie ist dafür gemacht.') });
    await villa_says([['<i>Der Ring, der sich in seine Hand gebrannt hat. Und in meine, weil ich aus seiner gemacht bin.</i>', 4800, 'LUKE']]);
  } finally { state.talking = false; villa_sperre(false); }
  const H = ANW_HALL; try { if (typeof whiskey_suchBild === 'function') whiskey_suchBild([H.x - H.w / 2 + .25, 2.72, H.z + 1.5]); } catch (e) {} villa_ziel(); }); }
// Das Porträt (Fassung 3, F3_extras Haare): gemalt – Frau im dunklen Kleid, dunkelbraune Locken mit scharlachrotem Schimmer, Rabe auf der Schulter mit Ring am linken Fuß,
// Laterne mit kerzengerader, kalt-weißer Flamme, unten rechts „L. B.“. Als Leinwand-Decal in den gescannten Rahmen gesetzt (anwesen_buildHall ruft es auf).
function villa_portraetBild(frame) { const T = THREE, b = new T.Box3().setFromObject(frame), s = b.getSize(new T.Vector3()), c = b.getCenter(new T.Vector3());
  const rnd = (() => { let a = 7; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
  const cv = villa_cv(512, 680, (x, w, h) => {
    const bg = x.createRadialGradient(w * .5, h * .38, 30, w * .5, h * .5, h * .75); bg.addColorStop(0, '#3a2c20'); bg.addColorStop(1, '#0e0a08'); x.fillStyle = bg; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${60 + rnd() * 40},${40 + rnd() * 30},${24 + rnd() * 20},${rnd() * .08})`; x.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 9, 1 + rnd() * 2); } // Pinselstruktur
    // Kleid
    x.fillStyle = '#120e12'; x.beginPath(); x.moveTo(w * .22, h); x.bezierCurveTo(w * .26, h * .7, w * .3, h * .5, w * .36, h * .42); x.lineTo(w * .64, h * .42); x.bezierCurveTo(w * .7, h * .5, w * .74, h * .7, w * .8, h); x.fill();
    x.strokeStyle = 'rgba(80,60,70,.35)'; x.lineWidth = 2; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(w * (.34 + i * .035), h * .5); x.quadraticCurveTo(w * (.33 + i * .04), h * .75, w * (.3 + i * .05), h); x.stroke(); }
    // Hals, Gesicht (blass, im Dreiviertel, Augen niedergeschlagen)
    x.fillStyle = '#c8b09a'; x.fillRect(w * .46, h * .33, w * .08, h * .1); const fg = x.createRadialGradient(w * .5, h * .27, 8, w * .5, h * .28, 70); fg.addColorStop(0, '#e2cdb6'); fg.addColorStop(1, '#a48870'); x.fillStyle = fg; x.beginPath(); x.ellipse(w * .5, h * .27, 50, 66, -.06, 0, 7); x.fill();
    x.fillStyle = 'rgba(40,24,18,.75)'; x.beginPath(); x.ellipse(w * .46, h * .26, 9, 3, 0, 0, 7); x.ellipse(w * .545, h * .258, 9, 3, 0, 0, 7); x.fill(); x.fillStyle = 'rgba(120,50,44,.6)'; x.beginPath(); x.ellipse(w * .505, h * .325, 11, 3.5, 0, 0, 7); x.fill();
    // Locken: dunkelbraun mit scharlachrotem Schimmer
    for (let i = 0; i < 260; i++) { const a = rnd() * PI * 1.25 - PI * 1.12, r = 58 + rnd() * 38, cx = w * .5 + Math.cos(a) * r * 1.05, cy = h * .25 + Math.sin(a) * r * .95 + (rnd() < .45 ? rnd() * 150 : 0) * (Math.cos(a) > .2 || Math.cos(a) < -.2 ? 1 : 0);
      x.strokeStyle = rnd() < .22 ? `rgba(${150 + rnd() * 60},${24 + rnd() * 20},${22 + rnd() * 14},.55)` : `rgba(${38 + rnd() * 22},${22 + rnd() * 12},${14 + rnd() * 8},.9)`; x.lineWidth = 2 + rnd() * 4; x.beginPath(); x.arc(cx, cy, 5 + rnd() * 9, rnd() * 6, rnd() * 6 + 3.6); x.stroke(); }
    // Rabe auf ihrer linken Schulter (Bildrechts), Ring am linken Fuß
    x.fillStyle = '#060608'; x.beginPath(); x.ellipse(w * .7, h * .36, 34, 22, -.5, 0, 7); x.fill(); x.beginPath(); x.ellipse(w * .74, h * .31, 13, 12, 0, 0, 7); x.fill();
    x.beginPath(); x.moveTo(w * .765, h * .305); x.lineTo(w * .81, h * .315); x.lineTo(w * .765, h * .32); x.fill(); x.beginPath(); x.moveTo(w * .63, h * .38); x.lineTo(w * .56, h * .45); x.lineTo(w * .64, h * .41); x.fill();
    x.fillStyle = '#d8dce0'; x.beginPath(); x.arc(w * .748, h * .305, 1.8, 0, 7); x.fill(); x.strokeStyle = '#060608'; x.lineWidth = 2; x.beginPath(); x.moveTo(w * .69, h * .385); x.lineTo(w * .685, h * .41); x.moveTo(w * .71, h * .385); x.lineTo(w * .712, h * .41); x.stroke();
    x.strokeStyle = '#3a3226'; x.lineWidth = 3; x.beginPath(); x.ellipse(w * .686, h * .4, 3.5, 2, 0, 0, 7); x.stroke();
    // Hand mit Laterne, Flamme kerzengerade und kalt-weiß
    x.fillStyle = '#b89c84'; x.beginPath(); x.ellipse(w * .4, h * .66, 16, 11, .3, 0, 7); x.fill(); x.strokeStyle = '#2a2622'; x.lineWidth = 3; x.beginPath(); x.moveTo(w * .4, h * .66); x.lineTo(w * .4, h * .7); x.stroke();
    x.strokeStyle = '#4a4034'; x.lineWidth = 4; x.strokeRect(w * .35, h * .7, w * .1, h * .12); const gl = x.createRadialGradient(w * .4, h * .755, 2, w * .4, h * .76, 70); gl.addColorStop(0, 'rgba(235,242,255,.9)'); gl.addColorStop(.25, 'rgba(200,215,240,.35)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gl; x.fillRect(w * .2, h * .6, w * .4, h * .3);
    x.fillStyle = '#f4f8ff'; x.beginPath(); x.moveTo(w * .4, h * .725); x.quadraticCurveTo(w * .41, h * .76, w * .4, h * .785); x.quadraticCurveTo(w * .39, h * .76, w * .4, h * .725); x.fill();
    // Signatur
    x.fillStyle = 'rgba(150,120,80,.85)'; x.font = 'italic 26px Georgia'; x.fillText('L. B.', w * .78, h * .95);
    const vg = x.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, h * .72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); x.fillStyle = vg; x.fillRect(0, 0, w, h); });
  const m = new T.Mesh(new T.PlaneGeometry(s.z * .7, s.y * .74), new T.MeshStandardMaterial({ map: tex(cv, true), roughness: .62, metalness: 0 }));
  m.position.set(b.min.x + s.x * .62, c.y, c.z); m.rotation.y = PI / 2; m.userData.noCol = true; m.receiveShadow = true; scene.add(m); return m; }
async function villa_portraet() { const A = anwesen_S, H = ANW_HALL;
  if (villa_hat('ring') && !villa_hat('noten')) { villa_setz('noten'); A.seen.add('noten'); state.talking = true;
    try { await villa_says([['Du hebst das Bild an. Hinter dem Rahmen, zwischen Leinwand und Rückwand, steckt ein gefaltetes Blatt.', 4200]]); } finally { state.talking = false; }
    villa_note('Noten', 'Notenlinien, mit Lineal und Kugelschreiber gezogen, sauber, von einer Hand, die das gelernt hat. Die Melodie der Spieluhr.\n\nDarüber in einer anderen Schrift, braun, alt, wie mit einem Stöckchen geschrieben:\n\n' + villa_hand('„Schlaf, Kind, im Laternenschein“') + '\n\nKeine Unterschrift.', 'villa_noten', async () => {
      try { if (Audio.musicBox) Audio.musicBox(); } catch (e) {}
      await villa_says([['Die ersten fünf Noten kennst du. Du summst sie, ohne es zu wollen. Lucys Spieluhr. Das Lied aus Mamas Liederheft. Das, was Justin gesummt hat.', 6200], ['<i>Zwei Handschriften. Eine alte. Und eine, die Notenlinien mit dem Lineal zieht.</i>', 4200, 'LUKE'],
        ['Die Hand, die die Laterne hält, trägt keinen Ring. Am Ringfinger ist die Haut heller, wie bei jemandem, der ihn sehr lange getragen hat.', 5600]]);
      if (typeof todCheckpoint === 'function') todCheckpoint('k4_portraet', 'Villa · Porträt'); villa_uk(13); villa_ziel(); }); return true; }
  return false; void H; }

// =====================================================================  Tageslicht Kap. 4 (Morgen, Nebel) – nur Umgebung/Intensitäten, je Bild nach dem Basis-Update
function villa_tagTick() { const T = VILLA.tag, kinoAn = typeof kino_S !== 'undefined' && kino_S.on, on = state.started && villa_kap4() && !kinoAn && !state.ending;
  if (on && !T.an) { T.an = true; const U = skyMat.uniforms; T.sv = { fogC: scene.fog.color.getHex(), fogD: scene.fog.density, hC: hemi.color.getHex(), hG: hemi.groundColor.getHex(), mC: moon.color.getHex(), sH: U.horizon.value.getHex(), sZ: U.zenith.value.getHex(), sD: U.dim.value, gf: fogUniforms.color.value.clone() };
    hemi.color.setHex(0x9aa4b4); hemi.groundColor.setHex(0x3a3630); moon.color.setHex(0xc8d0dc); U.horizon.value.setHex(0x9ca2a8); U.zenith.value.setHex(0x5a6674); U.dim.value = 1; fogUniforms.color.value.setHex(0x8c9298).multiplyScalar(1.25); }
  else if (!on && T.an && !kinoAn) { T.an = false; const s = T.sv, U = skyMat.uniforms; if (s) { scene.fog.color.setHex(s.fogC); scene.fog.density = s.fogD; hemi.color.setHex(s.hC); hemi.groundColor.setHex(s.hG); moon.color.setHex(s.mC); U.horizon.value.setHex(s.sH); U.zenith.value.setHex(s.sZ); U.dim.value = s.sD; fogUniforms.color.value.copy(s.gf); } }
  if (!T.an) return; const drin = !!VILLA.raum || (typeof anwesen_S !== 'undefined' && anwesen_S.inHall);
  scene.fog.color.setHex(0x80868c); scene.fog.density = drin ? .007 : .03;
  if (rain && rain.m) rain.m.visible = false; }

// Licht Kap. 4 über den Basis-Haken (LICHT_HAKEN, je Bild nach der Basis-Lichtzeile): tagsüber steht die Hemisphäre drinnen für das Fensterlicht –
// die alten Werte (Halle .6, Räume .3–.45) waren physikalisch Dämmerung, die Räume lasen sich schwarz. Faktor 9 auf die Raumwerte, Halle 4,2 (Deckenlicht oben + Stehlampe; dunkle Scan-Tapeten schlucken viel), drinnen Belichtung 1,2; Kühlraum bleibt fast dunkel.
function villa_tagLicht(dt, indoor, rect, k) { const T = VILLA.tag; if (!T || !T.an) return; const drin = !!VILLA.raum || (typeof anwesen_S !== 'undefined' && anwesen_S.inHall);
  hemi.intensity = drin ? (VILLA.raum ? VILLA.amb * 9 : 4.2) : .95 * (1 - k) + .32 * k; moon.intensity = drin ? 0 : .3 * (1 - k); scene.environmentIntensity = drin ? .12 : .4 * (1 - k) + .08 * k; renderer.toneMappingExposure = (drin ? 1.2 : 1.1) * settings.bright; }
if (typeof LICHT_HAKEN !== 'undefined') LICHT_HAKEN.push(villa_tagLicht);

// =====================================================================  Laden, Takt
if (typeof KAP_BEGIN !== 'undefined') KAP_BEGIN[4].push(() => villa_kapStart());
if (typeof CH_RESUME !== 'undefined') CH_RESUME.push((d, at) => { // Weiterspielen in einem Kap.-4-Innenraum: zurück in die Halle bzw. vor Nr. 3 / Nr. 9 (Räume bauen sich beim Betreten)
  if (d.chapter !== 4 || !at) return; const k = villa_raumBei(at.x, at.z); if (!k) return;
  if (k === 'nr3') { player.pos.set(-27.9, 0, -10.2); player.yaw = PI; } else if (k === 'nr9') { player.pos.set(57.7, 0, -10.9); player.yaw = PI; }
  else { const H = ANW_HALL; player.pos.set(H.x, 0, H.z - 1); player.yaw = PI; if (typeof anwesen_S !== 'undefined') { anwesen_S.open = true; anwesen_S.inHall = true; } Audio.setArea(true, false); }
  VILLA.raum = null; villa_ziel(); });
WORLD_MODS.push(['Villa', async () => {
  const g = new THREE.Group(); g.name = 'villa'; g.visible = false; scene.add(g); VILLA.g = g;
  for (let i = 0; i < 18; i++) { const L = new VLight(0xffffff, 0, 6, 2); L.position.set(-5000, -50, -5000); scene.add(L); VILLA.L.push(L); } // alle Lichter beim Laden, Intensität 0
  if (typeof kiffen_S !== 'undefined') kiffen_S.auto = false;
  try { if (typeof kiffen_fund === 'function') kiffen_fund('tips', [VILLA_R.nr3.x1 - 1.1, .92, 855.5], { label: 'Küchenschublade · Streichhölzer' }); } catch (e) { console.warn('Villa: Tips', e); }
  try { if (typeof karte_blatt === 'function') karte_blatt('villa', { x0: -945, x1: -855, z0: 855, z1: 945 }); } catch (e) {}
  try { if (typeof sammeln_platz === 'function') sammeln_platz('Z-09', { x: 23.35, y: 1.02, z: -11.86, ry: 0, stehend: 1, ab: 4, label: 'Zeitungsrolle im Türgriff · Nr. 7' }); } catch (e) { console.warn('Villa: Z-09', e); }
  // Vegas' Tür in Kap. 4 (Nr. 3), Garagentor Nr. 9, Kombi-Gespräch „später“
  VILLA.hit.nr3 = box(1.1, 2.1, .35, -28, 1.5, -12.0, hidden, { cast: false }); interact(VILLA.hit.nr3, () => villa_hat('lucy') ? 'Nr. 3 · Vegas' : 'An Vegas’ Tür klopfen', () => villa_nr3Klopfen()); uninteract(VILLA.hit.nr3);
  VILLA.hit.nr9 = box(1.6, 1.2, .5, 57.7, .6, -12.25, hidden, { cast: false }); interact(VILLA.hit.nr9, 'Garagentor Nr. 9 · einen Spalt offen', () => villa_nr9Rein()); uninteract(VILLA.hit.nr9);
  VILLA.hit.kombi = box(1.4, 2, 1.4, 51.6, 1, -9.9, hidden, { cast: false }); interact(VILLA.hit.kombi, 'Nachsorge 11 ansprechen', () => villa_ag12Kombi()); uninteract(VILLA.hit.kombi);
  window.__villa = { S: villa_S, V: VILLA, R: VILLA_R, ev: s => eval(s), geh: (k, o) => villa_geh(k, o), bau: k => villa_bauen(k), uk: () => villa_S.uk };
}]);
const _villaHits = () => [['nr3', () => villa_kap4() && !(typeof anwesen_S !== 'undefined' && anwesen_S.inHall) && !VILLA.raum], ['nr9', () => villa_kap4() && (villa_hat('ag12') || villa_hat('ag12_offen'))], ['kombi', () => villa_kap4() && villa_hat('ag12_offen') && !villa_hat('ag12')]];
WORLD_TICK.push(dt => {
  if (!VILLA.g || !state.started) return;
  villa_heil(dt);
  villa_tagTick(); if (VILLA.hp || VILLA.ag13) { villa_ag13Tick(dt); }
  VILLA.chk -= dt; if (VILLA.chk > 0) return; VILLA.chk = .25; const k4 = villa_kap4();
  villa_sichtbar(); if (!k4) { if (VILLA.crew) villa_crewAus(); if (VILLA.kombi === true) { VILLA.kombi = 'aus'; try { lwo_kombiWeg(); } catch (e) {} } return; }
  for (const [k, f] of _villaHits()) { const h = VILLA.hit[k]; if (!h) continue; const on = !!f(), i = interactables.indexOf(h); if (on && i < 0) interactables.push(h); else if (!on && i >= 0) interactables.splice(i, 1); }
  const A = typeof anwesen_S !== 'undefined' ? anwesen_S : null, P = player.pos;
  if (A && A.ch4 && !A.open && !A.hallDone) { if (!VILLA.crew && !villa_hat('villa_betreten')) villa_crewAn(); if (VILLA.crew) villa_crewTick(); } else if (VILLA.crew) villa_crewAus();
  if (A && A.open && !villa_hat('villa_betreten')) { villa_setz('villa_betreten'); villa_ag12Verfall(); villa_uk(6); }
  // Kombi rollt heran, sobald Luke auf Nr. 3 zugeht; B-K4-02 auf der Fußmatte
  if (!VILLA.kombi && !villa_hat('lucy') && Math.hypot(P.x + 28, P.z + 9) < 20 && typeof lwo_kombiZeigen === 'function') { VILLA.kombi = true; try { lwo_kombiZeigen(96, -5.6, -PI / 2, { motor: true }); lwo_kombiFahre([[70, -6], [53, -9.2]], 6).then(() => { try { lwo_kombiMotor(false); } catch (e) {} }); } catch (e) {} villa_beob('b_k4_02', { pos: [-28, .02, -11.72] }); }
  if (VILLA.kombi === false && villa_hat('lucy') && typeof lwo_kombiZeigen === 'function') { VILLA.kombi = true; try { lwo_kombiZeigen(53, -9.2, -PI / 2); } catch (e) {} }
  if (A && A.key && !villa_hat('n3')) { villa_setz('n3'); setTimeout(() => villa_beob('b_k4_n3', { vor: true }), 5200); villa_ziel(); }
  if (A && A.inHall) { villa_halleTick(); if (villa_hat('zelle') && !villa_hat('ag14') && !villa_hat('ag14_lauf') && !VILLA.busy && !VILLA.redeN && !ui.overlay && !(typeof LWO !== 'undefined' && LWO.playing) && villa_hat('pling')) { VILLA.ag14T = (VILLA.ag14T || 0) + .25; if (VILLA.ag14T > 1.5 && (!state.talking || VILLA.ag14T > 4)) { VILLA.ag14T = 0; state.talking = false; villa_ag14(); } } else VILLA.ag14T = 0; }
});
