// =====================================================================  AMT (Modul „amt“, Fassung 3 · AP-16): Kapitel 2 „Das achte Kind“ – Ebene −2 der Bundesstelle für Rückführung
// Quelle: story_final.md Kapitel 2 (Unterkapitel 1–9, Nebenaufgaben, Rätsel, Schreckbudget, Umsetzungsnotizen), LWO-Dossier 5.3/5.4/5.5/5.12 (Wortlaute).
// Dieses Modul baut, was die Basis und innen_kapitel nicht haben, und führt die Regie der Ebene:
//   • Nadeldrucker (amt_druck): druckt Luke live mit, oben rechts immer „ZÄHLSCHLUSS 03:13“; ab dem Funk auch K-1 (A-05); der letzte Druck kommt aus dem Messraum.
//   • Lautsprecher (amt_band): Wolters Bandschleife (AG-05) mit hörbaren Schnitten, darunter leise die Spieluhr; Speicherzettel 5.12 am Kasten.
//   • Tunnel: Schild der Bundesstelle mit dem Auge über der Flamme, Dienstanweisung, Bahnhofsuhr, Nummernautomat („Wartenummer 8“), Kinderhandabdrücke, das Summen.
//   • Neue Räume (Wände, Böden, Einrichtung aus Scans): Kantine und Hängeregistratur (Türen in der Archiv-Westwand), Planungsraum (hinter dem Sicherungsraum),
//     Vorraum des Messraums (Trennwand, Aktenschränke für AG-07). Messraum: Stuhlkreis (innen_kapitel), Stuhl 8, Uhr über der Tür, Kette, Notbeleuchtung.
//   • Die sieben Nebenaufgaben (story.side.k2_*): „Dasselbe Kleid“, „Gott steh Lost Eyengless bei“, „Ich habe nicht gefragt, wen“, „Eins zu siebenundachtzig“,
//     „Er würde mit jedem mitgehen“, „Einmachen“, „Nicht füttern“.
//   • Haken für die Basis: amt_notstrom (AG-05 beim Notstrom), amt_ag06 (Funk vor dem ersten Hebel), amt_fuseFalsch (A-06), amt_klavier (Lucy summt, Tasten beschlagen),
//     amt_akte08 (Akte 08 → ein Satz → Lucy), amt_stuhl8, K-1-Präsenz ohne Kontakt (A-05 / 5.3).
// Technik: keine Lichter zur Laufzeit (Röhren über c2Tube beim Laden, Notlicht mit Intensität 0), keine Allokationen im Takt, Möbel als Instanzen (amt_kit/amt_put).
const AMT = { x: C2.x, z: C2.z, h: C2.h };
const amt_S = { ready: false, t: 0, said: {}, q: [], druckT: 0, druckZ: [], band: false, bandQ: [], k1: { t: 150, n: 0 }, nr: false, tuer: {}, kits: [], alt: {}, uhrT: 0, schritt: {}, luke: 0 };
// Spielstand: Fortschritt dieses Moduls (Basis-Flags der Ebene speichert tod.js über tod_ch2Snap)
const AMT_SAVE = ['akte06', 'batt', 'klavierFehl', 'danke', 'nr', 'ag06', 'ag07', 'reg', 'regFotos', 'regDreh', 'kantine', 'brett', 'kasse', 'leiter', 'leiterSteht', 'gruendung', 'vernichter', 'modell', 'modellN', 'kuehl', 'bogen', 'stuhl8', 'bogenFlocke', 'akte8', 'tankHand', 'lucyDa', 'umschlag'];
MOD_SAVE.push(['amt', () => { const o = {}; for (const k of AMT_SAVE) if (amt_S[k] !== undefined) o[k] = amt_S[k]; o.druck = amt_S.druckZ.slice(-14); return o; },
  v => { if (!v || typeof v !== 'object') return; for (const k of AMT_SAVE) if (v[k] !== undefined) amt_S[k] = v[k]; if (Array.isArray(v.druck)) amt_S.druckZ = v.druck.slice(-14); amt_S.geladen = true; }]);

// ---------------------------------------------------------------- Nebenaufgaben (vor dem Laden anlegen, damit der Spielstand sie findet)
const AMT_SIDE = {
  k2_kleid: ['Dasselbe Kleid', 'Neben dem Archiv: HÄNGEREGISTRATUR · Zyklen. Ein Zahlenschloss mit vier Feldern. Darunter, mit Kreide: „Alle siebzehn.“'],
  k2_kantine: ['Gott steh Lost Eyengless bei', 'Eine Nebentür im Archiv: KANTINE · Bitte Geschirr zurückbringen.'],
  k2_gruendung: ['Ich habe nicht gefragt, wen', 'Oben auf dem letzten Archivschrank liegt ein Aktendeckel: GRÜNDUNG. Ohne Leiter kommt man nicht hin.'],
  k2_modell: ['Eins zu siebenundachtzig', 'Hinter dem Sicherungsraum: PLANUNG · Zyklus 42. Das ganze Dorf auf einem Tisch.'],
  k2_bogen: ['Er würde mit jedem mitgehen', 'In Akte 06 steckt ein zweites, gefaltetes Blatt.'],
  k2_einmachen: ['Einmachen', 'Eine Nische im Sicherungsraum: KÜHLUNG · Substanz S · Zutritt nur mit Freigabe.'],
  k2_fuettern: ['Nicht füttern', 'Aus dem Aktenvernichter im Archiv hängen Papierstreifen.'],
};
for (const [k, [title, desc]] of Object.entries(AMT_SIDE)) { const q = story.side[k]; if (q) { q.title = title; q.kap = 2; } else story.side[k] = { title, desc, state: 'hidden', kap: 2 }; }
function amt_side(k) { try { if (story.side[k] && story.side[k].state === 'hidden') sideStart(k); } catch (e) {} }
function amt_sideDone(k, desc) { try { sideDone(k, desc); } catch (e) {} }
function amt_lore(key, title, html) { if (!story.lore.some(l => l.key === key)) story.lore.push({ key, title, html }); }
function amt_trust(key) { try { if (typeof lwo_ereignis === 'function') lwo_ereignis(key); } catch (e) {} }
modItem('wartenummer', 'Wartenummer 8', 'Aus dem Nummernautomaten im Tunnel. Eine 8, schwarz auf Pappe. Wird nie aufgerufen.', 'paper');
modItem('leiter_amt', 'Leiter', 'Eine Holzleiter aus dem Sicherungsraum. Schwer, und sie klappert bei jedem Schritt.', 'key');
modItem('umschlag7', 'Brauner Umschlag', '„BfR · AST LE · DURCHSCHLAG · VERTRAULICH“. Aus dem Fach mit Akte 08. Ungeöffnet. Nicht jetzt.', 'paper');
// F3 Verständlichkeit: die Aufgaben der Basis auf Ebene −2 sagen, warum (das Ziel ist Lucy) – exakte Ersetzung, alles andere bleibt wie gesetzt
const AMT_ZIEL = { 'Folge dem Tunnel.': 'Folge dem Gang. Irgendwo hier unten ist Lucy.', 'Finde heraus, was das Amt über die Kinder wusste.': 'Die Akten der sieben Kinder von 2009. Lucys und deine sind dabei. Lies sie.',
  'Weiter nach Osten. Die Stahltür sollte sich jetzt öffnen lassen.': 'Der Strom ist da. Weiter nach Osten – die Stahltür sollte jetzt aufgehen.', 'Der Messraum. Hier ist es passiert.': 'Da vorn liegt der Messraum. Von dort kommt Lucys Summen.', 'Bring die Namen in die richtige Reihenfolge.': 'Bring die Namen in die richtige Reihenfolge. Die Ordnungstafel im Archiv: wer zuerst zurückkam, steht links.', 'Der Messraum. Das Klavier.': 'Lucy ist im Tank. Sie summt. Spiel auf dem Klavier nach, was sie summt.' };
setC2Objective = (o => t => o(Object.prototype.hasOwnProperty.call(AMT_ZIEL, t) ? AMT_ZIEL[t] : t))(setC2Objective);

// Matratze in Peters Zelle (Prüfraum 3): Eisenbett ist eine InstancedMesh (innen_kapitel) – feuer_bedSpot sucht nur normale Meshes und fällt dann auf den Boden zurück.
// Hier wird die Oberkante der Matratze direkt an den Instanzen gemessen (Strahl von oben); feuer_bedSpot (Feuerzeug) und das Oma-Foto nutzen diesen Wert.
function amt_bettOben() { try { const X0 = C2.x, Z0 = C2.z, rc = new THREE.Raycaster(), o = new THREE.Vector3(), dn = new THREE.Vector3(0, -1, 0); rc.camera = camera; rc.far = 1.8;
    for (const [dx, dz] of [[.2, 0], [.45, .02], [-.1, -.02], [.7, 0], [-.35, 0]]) { const x = X0 + 41.4 + dx, z = Z0 - 4.45 + dz; rc.set(o.set(x, 1.7, z), dn);
      const h = rc.intersectObjects(scene.children, true).find(q => q.object.visible && q.object.isInstancedMesh && q.point.y > .35 && q.point.y < .85); if (h) return { x, y: h.point.y, z }; } } catch (e) {} return null; }
try { if (typeof feuer_bedSpot === 'function') feuer_bedSpot = (orig => () => { const r = orig(); if (r && r.y < .2) { const b = amt_bettOben(); if (b) return b; } return r; })(feuer_bedSpot); } catch (e) {}
// ---------------------------------------------------------------- Werkzeuge
let amt_rs = 16061; const amt_R = (a, b) => { amt_rs = (amt_rs * 16807) % 2147483647; return a + (b - a) * (amt_rs / 2147483647); };
function amt_cv(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; echt_an(() => fn(c.getContext('2d'), w, h)); return c; }
// Papier: Grundton, Faser, Stockflecken, Kaffeerand, Knick (Q-3: echte Oberflächen)
function amt_papier(x, w, h, o = {}) { const R = amt_R; papierScan(x, w, h, o.bg || '#ddd4bb', { dreck: .4 }); // echtes Papier statt Fläche + Pünktchen
  for (let i = 0; i < (o.flecken ?? 3); i++) { const g = x.createRadialGradient(R(0, w), R(0, h), 0, R(0, w), R(0, h), R(w * .08, w * .45)); g.addColorStop(0, `rgba(120,90,40,${R(.03, .12)})`); g.addColorStop(1, 'rgba(120,90,40,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }
  if (o.knick) { const y = h * R(.35, .65); const g = x.createLinearGradient(0, y - 6, 0, y + 6); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, 'rgba(60,40,20,.18)'); g.addColorStop(1, 'rgba(255,255,255,.06)'); x.fillStyle = g; x.fillRect(0, y - 6, w, 12); }
  if (o.kaffee) { x.strokeStyle = 'rgba(110,70,30,.35)'; x.lineWidth = 5; x.beginPath(); x.arc(w * R(.55, .8), h * R(.6, .85), w * .12, 0, 5.6); x.stroke(); }
  const e = x.createLinearGradient(0, 0, w, 0); e.addColorStop(0, 'rgba(80,60,30,.18)'); e.addColorStop(.06, 'rgba(0,0,0,0)'); e.addColorStop(.94, 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(80,60,30,.18)'); x.fillStyle = e; x.fillRect(0, 0, w, h); }
// Das Zeichen: ein Kreis, darin ein Auge über einer Flamme (klein, wie ein Druckfehler)
function amt_auge(x, cx, cy, r, col = '#1d1c1a') { x.save(); x.strokeStyle = col; x.fillStyle = col; x.lineWidth = Math.max(1.2, r * .1); x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke();
  x.beginPath(); x.moveTo(cx - r * .62, cy - r * .12); x.quadraticCurveTo(cx, cy - r * .62, cx + r * .62, cy - r * .12); x.quadraticCurveTo(cx, cy + r * .34, cx - r * .62, cy - r * .12); x.stroke();
  x.beginPath(); x.arc(cx, cy - r * .14, r * .15, 0, 7); x.fill();
  x.beginPath(); x.moveTo(cx, cy + r * .82); x.quadraticCurveTo(cx - r * .3, cy + r * .5, cx - r * .06, cy + r * .24); x.quadraticCurveTo(cx + .02 * r, cy + r * .42, cx + r * .1, cy + r * .26); x.quadraticCurveTo(cx + r * .3, cy + r * .54, cx, cy + r * .82); x.fill(); x.restore(); }
const amt_tex = (c, srgb = true) => tex(c, srgb);
function amt_decal(c, o = {}) { return new THREE.MeshStandardMaterial({ map: amt_tex(c), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, roughness: o.rough ?? .9, metalness: o.metal ?? 0, emissive: o.em ? new THREE.Color(o.em) : 0x000000, emissiveMap: o.em ? amt_tex(c) : null, emissiveIntensity: o.emI ?? 0 }); }
// Wandfläche/Decal als eigenes Mesh (ry: Blickrichtung der Fläche 0 → +z, π → −z, π/2 → +x, −π/2 → −x)
function amt_flaeche(mat, x, y, z, w, h, ry = 0, rz = 0, rx = 0) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz, 'YXZ'); m.receiveShadow = true; m.userData.noCol = true; m.renderOrder = 1; scene.add(m); return m; }
function amt_boden(mat, x, z, w, h, rot = 0, y = .013) { return amt_flaeche(mat, x, y, z, w, h, rot, 0, -PI / 2); }
function amt_hit(x, y, z, w, h, d, label, fn) { const b = box(w, h, d, x, y, z, hidden, { cast: false }); interact(b, label, fn); return b; }
function amt_note(title, html, key, after) { openNote(title, html, key ? 'amt_' + key : undefined, after); }
function amt_nah(x, z, r) { const P = player.pos; return (P.x - x) * (P.x - x) + (P.z - z) * (P.z - z) < r * r; }
function amt_in(x0, x1, z0, z1) { const P = player.pos; return P.x > x0 && P.x < x1 && P.z > z0 && P.z < z1; }
// Modelle als Instanzen: laden, normieren (Unterkante y = 0, Mitte x/z = 0), platzieren (x/z = Mitte der Grundfläche; minX/maxX/minZ/maxZ richten an einer Wand aus)
async function amt_kit(key, file, size, axis = 'y', spec) {
  try { const root = file.endsWith('.fbx') ? await msFBX(key, file, spec || {}) : (await msModel(key, file)).clone(true); root.updateMatrixWorld(true);
    const parts = []; root.traverse(m => { if (m.isMesh && !m.isSkinnedMesh) parts.push({ geo: m.geometry.clone().applyMatrix4(m.matrixWorld), mat: m.material, name: m.name }); });
    if (axis === 'lang') { const R = new THREE.Matrix4().makeRotationZ(PI / 2); parts.forEach(p => p.geo.applyMatrix4(R)); axis = 'y'; } // Leiter: liegt im Modell entlang x → aufrichten (sonst Maßstab über die Dicke = 22-fach, riesiger Balken im Gang)
    if (key === 'wardrobe') { const R = new THREE.Matrix4().makeRotationY(-PI / 2); parts.forEach(p => p.geo.applyMatrix4(R)); } // Fab „wardrobe“: Breite entlang z, Vorderseite +x → Vorderseite +z, Breite entlang x (alle Platzierungen unten gehen von „schaut nach +z“ aus; vorher standen die Schränke quer zur Wand)
    const bb = new THREE.Box3(); parts.forEach(p => { p.geo.computeBoundingBox(); bb.union(p.geo.boundingBox); }); const sz = bb.getSize(new THREE.Vector3()), s = size / (axis === 'max' ? Math.max(sz.x, sz.y, sz.z) : sz[axis]);
    const wx = key === 'wardrobe' ? .64 : 1, mt = new THREE.Matrix4().makeScale(s * wx, s, s).multiply(new THREE.Matrix4().makeTranslation(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2)); // wardrobe: 1,52 → 0,97 m breit (Schränke stehen im Abstand von ca. 1 m)
    parts.forEach(p => { p.geo.applyMatrix4(mt); p.geo.computeBoundingBox(); p.geo.computeBoundingSphere(); });
    const K = { key, parts, size: sz.multiplyScalar(s).multiply(new THREE.Vector3(wx, 1, 1)), list: [], shadow: true }; amt_S.kits.push(K); return K; } catch (e) { console.warn('amt: Modell ' + key, e); return null; } }
function amt_variant(K, fn) { if (!K) return null; const V = { key: K.key + '*', parts: K.parts.map(p => ({ geo: p.geo, name: p.name, mat: Array.isArray(p.mat) ? p.mat.map(fn) : fn(p.mat) })), size: K.size, list: [], shadow: K.shadow }; amt_S.kits.push(V); return V; }
const _amtV = new THREE.Vector3();
function amt_box(K, m) { const b = new THREE.Box3(); for (const p of K.parts) { const P = p.geo.attributes.position, st = Math.max(1, Math.floor(P.count / 800)); for (let i = 0; i < P.count; i += st) b.expandByPoint(_amtV.fromBufferAttribute(P, i).applyMatrix4(m)); } return b; }
function amt_put(K, x, z, o = {}) { if (!K) return null; const { ry = 0, s = 1, rx = 0, rz = 0, y = 0 } = o; const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
  const m = new THREE.Matrix4().compose(new THREE.Vector3(), q, o.sv ? o.sv.clone().multiplyScalar(s) : new THREE.Vector3(s, s, s)), b = amt_box(K, m);
  let px = x - (b.min.x + b.max.x) / 2, pz = z - (b.min.z + b.max.z) / 2; if (o.minX !== undefined) px = o.minX - b.min.x; if (o.maxX !== undefined) px = o.maxX - b.max.x; if (o.minZ !== undefined) pz = o.minZ - b.min.z; if (o.maxZ !== undefined) pz = o.maxZ - b.max.z;
  m.setPosition(px, y - b.min.y, pz); K.list.push(m); return m; }
// Einzelnes Modell als bewegliche Gruppe (Türen, Fotos, Figuren, Leiter)
function amt_einzel(K, x, y, z, o = {}) { if (!K) return null; const g = new THREE.Group(); for (const p of K.parts) { const mm = new THREE.Mesh(p.geo, p.mat); mm.castShadow = o.cast !== false; mm.receiveShadow = true; g.add(mm); }
  g.position.set(x, y, z); g.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ'); if (o.s) g.scale.setScalar(o.s); if (o.noCol) g.userData.noCol = true; scene.add(g); return g; }
function amt_top(K, m, x, z, from = 3) { const g = new THREE.Group(); for (const p of K.parts) g.add(new THREE.Mesh(p.geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))); g.applyMatrix4(m); g.updateMatrixWorld(true);
  const h = new THREE.Raycaster(new THREE.Vector3(x, from, z), new THREE.Vector3(0, -1, 0)).intersectObject(g, true)[0]; return h ? h.point.y : 0; }
function amt_flush() { for (const K of amt_S.kits) { if (!K.list.length) continue; const ims = msInst(K.parts, K.list, { shadow: K.shadow }); if (Array.isArray(ims)) ims.forEach((im, i) => { if (im) im.name = K.key + ':' + (K.parts[i].name || i); }); K.list = []; } } // Name z. B. „aktenschrank:korpus“ (Prüfung/Bildprüfer)

// ---------------------------------------------------------------- Requisiten aus Teilen (Fassung K2): Gehäuse mit Fasen und echten Materialien, je Material zu einem Mesh verschmolzen
// Teile: [Geometrie, Materialname, Matrix]; Maße in Metern, Unterkante y = 0, Vorderseite +z (Gruppe danach per Drehung ausrichten)
const AMTP = { mats: {}, noise: null };
function amtp_noise() { if (!AMTP.noise) { const c = amt_cv(128, 128, (x, w, h) => { amt_rs = 7; x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); for (let i = 0; i < 6000; i++) { const v = amt_R(70, 190) | 0; x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(amt_R(0, w), amt_R(0, h), 1.6, 1.6); } });
  AMTP.noise = amt_tex(c, false); AMTP.noise.repeat.set(8, 8); } return AMTP.noise; }
function amtp_mat(k) { const C = AMTP.mats; if (C[k]) return C[k]; const std = (o) => new THREE.MeshStandardMaterial(o); let m;
  switch (k) {
    case 'plastik': m = std({ color: 0xcdc5ad, roughness: .52, bumpMap: amtp_noise(), bumpScale: .35 }); break;
    case 'plastikGrau': m = std({ color: 0x9a9b94, roughness: .5, bumpMap: amtp_noise(), bumpScale: .35 }); break;
    case 'plastikDunkel': m = std({ color: 0x2a2c2e, roughness: .42, bumpMap: amtp_noise(), bumpScale: .3 }); break;
    case 'rauch': m = std({ color: 0x23282c, roughness: .1, metalness: .05, transparent: true, opacity: .5, depthWrite: false }); break;
    case 'gummi': m = std({ color: 0x141414, roughness: .88, bumpMap: amtp_noise(), bumpScale: .5 }); break;
    case 'stahl': m = std({ color: 0xa9adac, roughness: .32, metalness: .9 }); break;
    case 'stahlMatt': m = std({ color: 0x8c908c, roughness: .5, metalness: .65, bumpMap: amtp_noise(), bumpScale: .25 }); break;
    case 'lack': m = std({ color: 0x5f6a60, roughness: .55, metalness: .3, bumpMap: amtp_noise(), bumpScale: .4 }); break;
    case 'chrom': m = std({ color: 0xdfe2e1, roughness: .16, metalness: 1 }); break;
    case 'messing': m = std({ color: 0xb59a58, roughness: .35, metalness: .85 }); break;
    case 'papier': m = std({ color: 0xe6e1d0, roughness: .95, side: THREE.DoubleSide }); break;
    case 'karton': m = std({ color: 0xa88f66, roughness: .92, bumpMap: amtp_noise(), bumpScale: .5 }); break;
    case 'holz': m = std({ color: 0x8a6a45, roughness: .7, bumpMap: amtp_noise(), bumpScale: .5 }); break;
    case 'ton': m = std({ color: 0xb4623c, roughness: .88, bumpMap: amtp_noise(), bumpScale: .8 }); break;
    case 'erde': m = std({ color: 0x3a2a1e, roughness: 1, bumpMap: amtp_noise(), bumpScale: 1 }); break;
    case 'gruen': m = std({ color: 0x4f7a45, roughness: .62, bumpMap: amtp_noise(), bumpScale: .6 }); break;
    case 'ledGruen': m = std({ color: 0x103018, emissive: 0x22ff55, emissiveIntensity: .9, roughness: .3 }); break;
    case 'ledRot': m = std({ color: 0x301010, emissive: 0xff2a1a, emissiveIntensity: .7, roughness: .3 }); break;
    default: m = std({ color: 0xff00ff });
  } return (C[k] = m); }
const amtp_m = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(s, s, s));
// Abgerundeter Quader (Fase r), Mitte im Ursprung
function amtp_rbox(w, h, d, r = .006) { r = Math.min(r, w / 2 - .0005, h / 2 - .0005, d / 2 - .0005); const sh = new THREE.Shape(), a = w / 2 - r, b = h / 2 - r, q = r * .6;
  sh.moveTo(-a + q, -b); sh.lineTo(a - q, -b); sh.quadraticCurveTo(a, -b, a, -b + q); sh.lineTo(a, b - q); sh.quadraticCurveTo(a, b, a - q, b); sh.lineTo(-a + q, b); sh.quadraticCurveTo(-a, b, -a, b - q); sh.lineTo(-a, -b + q); sh.quadraticCurveTo(-a, -b, -a + q, -b);
  const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(.0004, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 2, curveSegments: 3 }); g.translate(0, 0, -(d - 2 * r) / 2); return g; }
// Profil (u = z, v = y) entlang x extrudiert, Mitte in x
function amtp_prof(pts, breite, r = .004) { const sh = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1]))); const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(.0004, breite - 2 * r), bevelEnabled: r > 0, bevelThickness: r, bevelSize: r * .8, bevelSegments: 1, curveSegments: 2 });
  g.translate(0, 0, -(breite - 2 * r) / 2); g.rotateY(-PI / 2); return g; }
const amtp_cyl = (r, h, seg = 20, r2) => new THREE.CylinderGeometry(r, r2 ?? r, h, seg);
const amtp_cylX = (r, l, seg = 20) => { const g = new THREE.CylinderGeometry(r, r, l, seg); g.rotateZ(PI / 2); return g; };
const amtp_cylZ = (r, l, seg = 20) => { const g = new THREE.CylinderGeometry(r, r, l, seg); g.rotateX(PI / 2); return g; };
// Boxprojektion der UVs (1 m = 1 Einheit), damit Bump/Textur gleichmäßig liegen, egal welche Primitive
function amtp_uv(g) { const P = g.attributes.position, N = g.attributes.normal, uv = new Float32Array(P.count * 2);
  for (let i = 0; i < P.count; i++) { const ax = Math.abs(N.getX(i)), ay = Math.abs(N.getY(i)), az = Math.abs(N.getZ(i)); let u, v; if (ay >= ax && ay >= az) { u = P.getX(i); v = P.getZ(i); } else if (ax >= az) { u = P.getZ(i); v = P.getY(i); } else { u = P.getX(i); v = P.getY(i); } uv[i * 2] = u; uv[i * 2 + 1] = v; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g; }
// Teile → Gruppe (je Material ein Mesh). o.cast: wirft Schatten
function amtp_baue(parts, o = {}) { const by = new Map();
  for (const [geo, mk, mat4] of parts) { let g = geo.index ? geo.toNonIndexed() : geo.clone(); for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal') g.deleteAttribute(n); if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(mat4); amtp_uv(g); const mm = typeof mk === 'string' ? amtp_mat(mk) : mk; if (!by.has(mm)) by.set(mm, []); by.get(mm).push(g); }
  const G = new THREE.Group(); for (const [mm, list] of by) { const m = new THREE.Mesh(mergeGeometries(list), mm); m.castShadow = o.cast !== false && !mm.transparent; m.receiveShadow = true; G.add(m); } return G; }
// Band (Papierstreifen, Gurt): Pfad aus Punkten (lokal), Breite quer zur x-Achse der Gruppe
function amtp_band(pts, breite, mat, o = {}) { const cur = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'catmullrom', .4), n = o.n || 40, P = [], U = [], I = [];
  for (let i = 0; i <= n; i++) { const t = i / n, p = cur.getPoint(t); P.push(p.x - breite / 2, p.y, p.z, p.x + breite / 2, p.y, p.z); const vv = o.fromTop ? 1 - t * (o.vSpan || 1) : t * (o.vSpan || 1); U.push(0, vv, 1, vv); if (i < n) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = false; m.receiveShadow = true; return m; }
// Quader-Fläche mit Canvas-Beschriftung (Etiketten, Tastenfelder): ebene Platte ohne Dicke, Blickrichtung +z
function amtp_schild(cv, w, h, o = {}) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: amt_tex(cv), roughness: o.rough ?? .6, metalness: o.metal ?? 0, transparent: !!o.alpha, depthWrite: !o.alpha, polygonOffset: true, polygonOffsetFactor: -2 })); m.receiveShadow = true; return m; }
// Druckerwagen komplett: Wagen, Drucker, Papierstapel, Zuführ- und Ausgabebahn (pm: Papiermaterial mit der Live-Textur)
function amtp_druckerWagen(pm) { const G = new THREE.Group(), hT = .8; G.add(amtp_wagen(.72, .46, hT)); const d = amtp_drucker(); d.position.y = hT; G.add(d);
  const st = amtp_stapel(.27, .22, .30); st.position.set(0, .23 + .11, -.02); G.add(st);
  G.add(amtp_band([[0, .46, -.1], [0, .5, -.2], [0, .66, -.26], [0, .86, -.258], [0, hT + .13, -.2], [0, hT + .125, -.15]], .21, amtp_mat('papier')));
  G.add(amtp_band([[0, hT + .12, .0], [0, hT + .15, .04], [0, hT + .185, .075], [0, hT + .195, .12], [0, hT + .17, .17], [0, hT + .09, .21], [0, hT - .05, .245], [0, .45, .255], [0, .12, .265], [0, .012, .33]], .22, pm, { n: 70, fromTop: true }));
  return G; }

// ---- Modell-Tankstelle (Maßstab 1:87, ca. 18 × 10 cm): Kiosk mit Flachdach, Zapfsäulendach auf vier Stützen, zwei Zapfsäulen, Preisschild-Mast, Asphaltplatte; Front +z
function amtp_tankstelle() { const P = [], A = (g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => P.push([g, m, amtp_m(x, y, z, rx, ry, rz)]), B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const putz = AMTP.mats.tkPutz || (AMTP.mats.tkPutz = new THREE.MeshStandardMaterial({ color: 0xd9d4c4, roughness: .85, bumpMap: amtp_noise(), bumpScale: .6 })), rot = AMTP.mats.tkRot || (AMTP.mats.tkRot = new THREE.MeshStandardMaterial({ color: 0xa8281e, roughness: .5 })),
    asph = AMTP.mats.tkAsphalt || (AMTP.mats.tkAsphalt = new THREE.MeshStandardMaterial({ color: 0x4a4a48, roughness: .95, bumpMap: amtp_noise(), bumpScale: 1 })), glas = AMTP.mats.tkGlas || (AMTP.mats.tkGlas = new THREE.MeshStandardMaterial({ color: 0x1c2a30, roughness: .1, metalness: .3 }));
  A(B(.19, .002, .11), asph, 0, .001, 0);
  A(B(.062, .032, .042), putz, -.05, .018, -.025); A(B(.068, .003, .048), rot, -.05, .0355, -.025); A(B(.034, .016, .0012), glas, -.05, .022, -.0036); A(B(.012, .024, .0012), glas, -.008 - .035, .016, -.0036);   // Kiosk
  A(B(.1, .004, .06), putz, .035, .056, .015); A(B(.1, .0025, .0025), rot, .035, .0545, .0455); A(B(.1, .0025, .0025), rot, .035, .0545, -.0155);                                                       // Dach der Zapfsäulen
  for (const [x, z] of [[-.012, -.012], [.082, -.012], [-.012, .042], [.082, .042]]) A(amtp_cyl(.0016, .054, 6), 'stahl', x, .028, z);
  for (const x of [.015, .055]) { A(B(.009, .024, .007), rot, x, .014, .015); A(B(.0092, .004, .0072), 'plastikDunkel', x, .027, .015); A(B(.006, .006, .0008), 'chrom', x, .019, .0188); }
  A(amtp_cyl(.0012, .085, 5), 'stahl', .09, .0445, -.04); A(B(.02, .016, .003), 'plastikDunkel', .09, .084, -.04);
  const G = amtp_baue(P, { cast: false });
  const pr = amtp_schild(amt_cv(64, 48, (x, w, h) => { x.fillStyle = '#e8d44a'; x.fillRect(0, 0, w, h); x.fillStyle = '#1b1b1b'; x.font = 'bold 15px Arial'; x.fillText('S 1,29', 4, 17); x.fillText('N 1,19', 4, 34); x.fillStyle = '#a8281e'; x.fillRect(0, h - 8, w, 8); }), .019, .0145, { rough: .5 }); pr.position.set(.09, .084, -.0385); G.add(pr);
  G.traverse(o => { if (o.isMesh) { o.userData.noCol = true; o.receiveShadow = true; } }); return G; }

// ---- Lederriemen (Fesselgurte) für die Stühle im Messraum: Beckengurt über der Sitzfläche mit Schnalle, Fußriemen an den Vorderbeinen; Stuhl 8: sauber durchtrennt (cut)
// Maße im Stuhlsystem (Mitte der Grundfläche, +z = Blickrichtung des Sitzenden): Sitzhöhe sy, halbe Sitzbreite sw, Sitztiefe zb (hinten) … zf (vorn)
function amtp_gurte(cut, o = {}) { const sy = o.sy ?? .46, sw = o.sw ?? .2, zb = o.zb ?? -.17, zf = o.zf ?? .19, P = [], W = .036, T = .005;
  const leder = AMTP.mats.leder || (AMTP.mats.leder = new THREE.MeshStandardMaterial({ color: 0x3b2a1b, roughness: .55, metalness: .05, bumpMap: amtp_noise(), bumpScale: .9 }));
  const seg = (a, b, w = W) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length(), m = new THREE.Matrix4(), up = Math.abs(d.y / L) > .9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    m.lookAt(A, B, up); m.setPosition(A.clone().add(B).multiplyScalar(.5)); P.push([new THREE.BoxGeometry(w, T, L), leder, m]); return L; };
  const poly = (pts, w = W) => { for (let i = 0; i < pts.length - 1; i++) seg(pts[i], pts[i + 1], w); };
  const nieten = (p) => P.push([amtp_cyl(.004, .003, 8), 'messing', amtp_m(p[0], p[1] + .004, p[2])]);
  const schnalle = (x, y, z, ry = 0) => { const q = [[new THREE.BoxGeometry(.046, .004, .006), 0, -.016], [new THREE.BoxGeometry(.046, .004, .006), 0, .016], [new THREE.BoxGeometry(.006, .004, .038), -.023, 0], [new THREE.BoxGeometry(.006, .004, .038), .023, 0], [new THREE.BoxGeometry(.003, .003, .034), 0, 0]];
    for (const [g, dx, dz] of q) { g.rotateY(ry); P.push([g, 'chrom', amtp_m(x + dx * Math.cos(ry) + dz * Math.sin(ry), y, z - dx * Math.sin(ry) + dz * Math.cos(ry))]); } };
  const y1 = sy + .012, yb = sy + .09;
  // Beckengurt: von den Seiten der Lehne über die Sitzfläche
  const links = [[-sw + .01, yb, zb + .02], [-sw + .01, y1 + .03, zb + .08], [-sw + .03, y1, 0], [-.05, y1, zf * .55]], rechts = [[sw - .01, yb, zb + .02], [sw - .01, y1 + .03, zb + .08], [sw - .03, y1, 0], [.05, y1, zf * .55]];
  if (!cut) { poly(links); poly(rechts); poly([[-.05, y1, zf * .55], [.05, y1, zf * .55]]); schnalle(0, y1 + .004, zf * .55, PI / 2); nieten([-.05, y1, zf * .55]); nieten([.05, y1, zf * .55]); nieten([-sw + .01, yb, zb + .02]); nieten([sw - .01, yb, zb + .02]);
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) P.push([amtp_cyl(.0028, .0009, 8), 'gummi', amtp_m(sx * (.065 + i * .018), y1 + .0028, zf * .55)]); }
  else { // durchtrennt: links liegt der Rest auf der Sitzfläche, rechts hängt er über die Kante; die Schnittkanten sind glatt und hell
    poly([[-sw + .01, yb, zb + .02], [-sw + .01, y1 + .03, zb + .08], [-sw + .03, y1, 0], [-.07, y1, zf * .35]]); poly([[sw - .01, yb, zb + .02], [sw - .01, y1 + .03, zb + .08], [sw - .02, y1, zb + .12], [sw - .02, y1 - .06, zb + .13]]);
    P.push([new THREE.BoxGeometry(W, T * .6, .004), 'papier', amtp_m(-.07, y1 + .001, zf * .35 + .002)]); P.push([new THREE.BoxGeometry(W, .004, T * .6), 'papier', amtp_m(sw - .02, y1 - .06 - .002, zb + .13, .1)]);
    poly([[.05, y1 - .002, zf * .72], [.11, y1 - .002, zf * .6], [.19, y1, zf * .3]]); schnalle(.05, y1 + .002, zf * .72, 0.5);   // das andere Ende mit Schnalle liegt lose auf der Sitzfläche
    nieten([-sw + .01, yb, zb + .02]); nieten([sw - .01, yb, zb + .02]);
    // Kerbe in der Lehne, zwei Finger breit, mit hellen Spänen an den Kanten (hier klemmt die Feder)
    P.push([new THREE.BoxGeometry(.04, .036, .034), 'gummi', amtp_m(0, o.ky ?? .79, o.kz ?? -.2)]); for (const sx of [-1, 1]) P.push([new THREE.BoxGeometry(.006, .04, .036), 'holz', amtp_m(sx * .0235, (o.ky ?? .79) + .004, o.kz ?? -.2, 0, 0, sx * .12)]); }
  // Fußriemen um die Vorderbeine (Schlaufe mit kurzem Ende); bei Stuhl 8 aufgeschnitten
  for (const sx of [-1, 1]) { const lx = sx * (sw - .025), lz = zf - .03, y = .14, r = .026, ring = new THREE.TorusGeometry(r, T / 2 + .0006, 5, 18, cut ? PI * 1.6 : PI * 2); ring.scale(1, 1, 1); ring.rotateX(PI / 2); ring.scale(1, W / .01, 1);
    const rg = new THREE.TorusGeometry(r, .0035, 5, 18, cut ? PI * 1.55 : PI * 2); rg.rotateX(PI / 2); P.push([rg, leder, amtp_m(lx, y, lz, 0, cut ? sx * .8 : 0, 0)]);
    const rg2 = new THREE.TorusGeometry(r, .0035, 5, 18, cut ? PI * 1.55 : PI * 2); rg2.rotateX(PI / 2); P.push([rg2, leder, amtp_m(lx, y + .014, lz, 0, cut ? sx * .8 : 0, 0)]);
    if (!cut) { schnalle(lx, y + .02, lz + r + .016, 0); } else { poly([[lx + sx * .01, y - .03, lz + r], [lx + sx * .02, .004, lz + r + .05]], .02); } }
  return amtp_baue(P, { cast: false }); }

// ---- Brotdose (Blechbüchse mit Verschluss), Deckel zu: Front +z, .17 × .065 × .12
function amtp_brotdose() { const P = [], A = (g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => P.push([g, m, amtp_m(x, y, z, rx, ry, rz)]), blau = AMTP.mats.dosenblau || (AMTP.mats.dosenblau = new THREE.MeshStandardMaterial({ color: 0x4f6c78, roughness: .42, metalness: .35, bumpMap: amtp_noise(), bumpScale: .5 }));
  A(amtp_rbox(.17, .042, .12, .008), blau, 0, .021, 0); A(amtp_rbox(.172, .024, .122, .01), blau, 0, .054, 0); A(amtp_rbox(.174, .004, .124, .002), 'stahl', 0, .041, 0);
  A(amtp_rbox(.03, .02, .008, .002), 'stahl', 0, .045, .064); A(amtp_rbox(.012, .012, .006, .002), 'stahlMatt', 0, .052, .068);
  for (const sx of [-1, 1]) A(amtp_cylZ(.003, .006, 8), 'stahl', sx * .07, .052, -.062);
  const G = amtp_baue(P);
  const bs = new THREE.Mesh(new THREE.PlaneGeometry(.1, .04), new THREE.MeshStandardMaterial({ transparent: true, depthWrite: false, roughness: .4, polygonOffset: true, polygonOffsetFactor: -2, map: amt_tex(amt_cv(256, 100, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#e8e2cc'; x.fillRect(30, 10, 196, 56); x.fillStyle = '#1d2a55'; x.font = '36px Caveat'; x.fillText('Hilde W.', 52, 52); x.strokeStyle = 'rgba(0,0,0,.2)'; x.strokeRect(30, 10, 196, 56); })) })); bs.position.set(0, .054, .0625); G.add(bs);
  return G; }
// ---- Aktenordner (Hebelordner), stehend: Rücken +x, Maße .08 × .32 × .285; rücken: Beschriftung
function amtp_ordner(farbe, rueck) { const mat = new THREE.MeshStandardMaterial({ color: farbe, roughness: .62, bumpMap: amtp_noise(), bumpScale: .6 }), P = [], A = (g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => P.push([g, m, amtp_m(x, y, z, rx, ry, rz)]);
  A(amtp_rbox(.285, .32, .08, .004), mat, 0, .16, 0); A(amtp_cylX(.011, .004, 14), 'stahl', .1425, .03, 0); A(amtp_rbox(.006, .32, .08, .002), 'stahlMatt', .1425, .16, 0);
  const G = amtp_baue(P);
  const lb = new THREE.Mesh(new THREE.PlaneGeometry(.2, .05), new THREE.MeshStandardMaterial({ roughness: .7, polygonOffset: true, polygonOffsetFactor: -2, map: amt_tex(amt_cv(512, 128, (x, w, h) => { x.fillStyle = '#ece6d2'; x.fillRect(0, 0, w, h); x.strokeStyle = '#7a7a70'; x.lineWidth = 4; x.strokeRect(2, 2, w - 4, h - 4); x.fillStyle = '#1b1b1b'; x.font = 'bold 64px "Special Elite", Courier New'; x.textAlign = 'center'; x.fillText(rueck, w / 2, 84); })) }));
  lb.rotation.order = 'YXZ'; lb.rotation.y = PI / 2; lb.rotation.z = -PI / 2; lb.position.set(.1457, .17, 0); G.add(lb); return G; }

// ---- Laborkühlschrank (Edelstahl, Glastür-Rahmen, vier Edelstahlböden mit Etikettenschienen, Magnetschloss): Front +z, Breite .78, Tiefe .62, Höhe 1.95
function amtp_kuehl() { const P = [], A = (g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => P.push([g, m, amtp_m(x, y, z, rx, ry, rz)]), B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const innen = AMTP.mats.innen || (AMTP.mats.innen = new THREE.MeshStandardMaterial({ color: 0xdde1de, roughness: .5, bumpMap: amtp_noise(), bumpScale: .2 }));
  A(B(.78, 1.95, .03), 'stahlMatt', 0, .975, -.295); for (const sx of [-1, 1]) A(amtp_rbox(.03, 1.95, .62, .004), 'stahl', sx * .375, .975, 0);
  A(amtp_rbox(.78, .05, .62, .006), 'stahl', 0, 1.925, 0); A(amtp_rbox(.78, .18, .62, .006), 'stahlMatt', 0, .09, 0);
  A(B(.72, 1.68, .01), innen, 0, 1.03, -.275); for (const sx of [-1, 1]) A(B(.008, 1.68, .55), innen, sx * .356, 1.03, 0); A(B(.72, .008, .55), innen, 0, .19, 0); A(B(.72, .008, .55), innen, 0, 1.865, 0);
  const sy = [.30, .72, 1.14, 1.56];
  for (const y of sy) { A(B(.70, .012, .52), 'stahl', 0, y, 0); A(B(.70, .028, .01), 'stahl', 0, y + .008, .26); A(amtp_rbox(.70, .022, .014, .003), 'plastikGrau', 0, y - .004, .27); for (const sx of [-1, 1]) A(B(.012, .02, .5), 'stahlMatt', sx * .346, y - .012, 0); }
  // Frontrahmen und Türrahmen (die Glasscheibe selbst setzt der Aufbau davor)
  for (const sx of [-1, 1]) A(B(.06, 1.76, .02), 'stahl', sx * .36, 1.04, .30); A(B(.78, .1, .02), 'stahl', 0, 1.895, .30); A(B(.78, .08, .02), 'stahl', 0, .24, .30);
  A(B(.66, .012, .008), 'gummi', 0, 1.835, .31); A(B(.66, .012, .008), 'gummi', 0, .265, .31); for (const sx of [-1, 1]) A(B(.012, 1.58, .008), 'gummi', sx * .33, 1.05, .31);
  for (const sx of [-1, 1]) A(B(.024, 1.62, .016), 'chrom', sx * .335, 1.05, .322); A(B(.694, .024, .016), 'chrom', 0, 1.862, .322); A(B(.694, .024, .016), 'chrom', 0, .238, .322);
  A(amtp_cyl(.011, .6, 14), 'chrom', .3, 1.0, .352); for (const y of [.75, 1.25]) A(amtp_cylZ(.007, .04, 8), 'chrom', .3, y, .335);
  // Magnetschloss: Gehäuse am Rahmen oben, Ankerplatte an der Tür, Kontrolllicht
  A(amtp_rbox(.13, .05, .034, .004), 'plastikDunkel', .2, 1.905, .33); A(B(.12, .022, .006), 'stahl', .2, 1.855, .332); A(new THREE.BoxGeometry(.008, .005, .004), 'ledRot', .255, 1.9, .349);
  // Inhalt: Kassler-Dose (privat), Schild „KÜHLUNG“ kommt vom Aufbau
  A(amtp_cyl(.046, .078, 24), 'stahl', .16, .306 + .039, .06); A(new THREE.TorusGeometry(.046, .0024, 6, 24), 'stahlMatt', .16, .306 + .074, .06, PI / 2); A(new THREE.TorusGeometry(.046, .0024, 6, 24), 'stahlMatt', .16, .31, .06, PI / 2);
  const G = amtp_baue(P);
  const lab = (txt, sub, y, x = 0, w = .15, strike = false) => { const m = amtp_schild(amt_cv(256, 56, (c, W, H) => { c.fillStyle = '#e6e0cb'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(0,0,0,.25)'; c.strokeRect(1, 1, W - 2, H - 2); c.fillStyle = '#1b1b1b'; c.font = 'bold 26px "Special Elite", Courier New'; c.fillText(txt, 8, 26); c.font = '17px "Special Elite", Courier New'; c.fillText(sub || '', 8, 48); if (strike) { c.strokeStyle = '#8a1a14'; c.lineWidth = 3; c.beginPath(); c.moveTo(4, 20); c.lineTo(W - 6, 14); c.stroke(); } }), w, w * 56 / 256, { rough: .7 }); m.position.set(x, y - .004, .2785); G.add(m); };
  lab('∴-1', 'verlegt Villa', 1.56, -.18); lab('∴-2', 'verlegt Villa', 1.14, -.18); lab('∴-3', 'nicht fixierbar', .72, -.18, .15, true);
  lab('Substanz S', 'Charge 92/3 · K-1', 1.56, .2, .17); lab('Substanz S', 'Ration · monatlich', 1.14, .2, .17); lab('Privat.', 'Nicht anfassen. N. 12.', .30, -.18, .17);
  const dk = new THREE.Mesh(new THREE.CylinderGeometry(.0462, .0462, .05, 28, 1, true), new THREE.MeshStandardMaterial({ roughness: .6, map: amt_tex(amt_cv(256, 64, (c, W, H) => { c.fillStyle = '#c9b66a'; c.fillRect(0, 0, W, H); c.fillStyle = '#2a1e10'; c.font = 'bold 30px Arial'; c.fillText('KASSLER', 70, 42); })) })); dk.position.set(.16, .306 + .039, .06); G.add(dk);
  // Spuren auf den Böden: Reifring (∴-1), Fleck (Charge), Staub mit sauberem Kreis (Ration)
  const spur = (cv, y, x, z, w, d) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: amt_tex(cv), transparent: true, depthWrite: false, roughness: .9, polygonOffset: true, polygonOffsetFactor: -3 })); m.rotation.x = -PI / 2; m.position.set(x, y + .0066, z); G.add(m); };
  spur(amt_cv(128, 128, (c, w) => { c.clearRect(0, 0, w, w); c.strokeStyle = 'rgba(240,248,250,.8)'; c.lineWidth = 6; c.beginPath(); c.arc(64, 64, 40, 0, 7); c.stroke(); c.lineWidth = 2; c.beginPath(); c.arc(64, 64, 49, 0, 7); c.stroke(); for (let i = 0; i < 80; i++) { c.fillStyle = `rgba(250,252,255,${amt_R(.1, .5)})`; c.fillRect(amt_R(10, 118), amt_R(10, 118), 2, 2); } }), sy[3], -.18, .0, .14, .14);
  spur(amt_cv(128, 128, (c, w) => { c.clearRect(0, 0, w, w); const g = c.createRadialGradient(64, 64, 4, 64, 64, 56); g.addColorStop(0, 'rgba(70,40,24,.85)'); g.addColorStop(.6, 'rgba(90,60,40,.45)'); g.addColorStop(1, 'rgba(90,60,40,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }), sy[3], .2, .02, .13, .13);
  spur(amt_cv(256, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(150,146,134,.5)'; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(w / 2, h / 2, 40, 0, 7); c.fill(); }), sy[2], .2, .0, .3, .15);
  G.userData.led = null; return G; }

// ---- Hängemappe (Pendelregistratur), flach auf dem Tisch: Rückseite, abgehobene Vorderseite, Aufhängeschiene mit Haken, Reiter mit Jahreszahl
function amtp_mappe(farbe, jahr) { const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(farbe), roughness: .9, bumpMap: amtp_noise(), bumpScale: .5 }), P = [], A = (g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => P.push([g, m, amtp_m(x, y, z, rx, ry, rz)]);
  A(new THREE.BoxGeometry(.33, .0016, .24), mat, 0, .0008, 0);
  A(new THREE.BoxGeometry(.33, .0016, .225), mat, 0, .0042, .008, .02);
  A(new THREE.BoxGeometry(.33, .006, .01), mat, 0, .0028, -.113);
  A(amtp_cylX(.0026, .385, 8), 'stahl', 0, .0066, -.121);
  for (const sx of [-1, 1]) A(amtp_rbox(.012, .006, .016, .002), 'stahl', sx * .19, .0066, -.121);
  A(amtp_rbox(.044, .004, .016, .0015), 'rauch', -.09, .0092, -.13);
  const G = amtp_baue(P, { cast: true });
  const lb = amtp_schild(amt_cv(64, 32, (x, w, h) => { x.fillStyle = '#ece6d2'; x.fillRect(0, 0, w, h); x.fillStyle = '#1b1b1b'; x.font = 'bold 20px "Special Elite", Courier New'; x.fillText(jahr, 8, 24); }), .036, .012, { rough: .6 });
  lb.rotation.x = -PI / 2; lb.position.set(-.09, .0114, -.13); G.add(lb); return G; }

// ---- Aktenvernichter (Bürogerät mit Auffangkorb): Front +z, Breite .42, Höhe .57; Papierstreifen hängen aus dem Schlitz (eigene Gruppe, damit sie verschwinden können)
function amtp_vernichter() { const P = [], A = (g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => P.push([g, m, amtp_m(x, y, z, rx, ry, rz)]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { A(amtp_cylX(.02, .016, 14), 'gummi', sx * .17, .02, sz * .09); A(amtp_rbox(.012, .02, .03, .002), 'stahlMatt', sx * .17, .045, sz * .09); }
  A(amtp_rbox(.38, .46, .26, .012), 'plastikDunkel', 0, .27, 0);
  A(amtp_rbox(.34, .30, .014, .005), 'plastikGrau', 0, .26, .134);                  // Schubladenfront
  A(amtp_rbox(.14, .024, .018, .007), 'plastikDunkel', 0, .39, .142);              // Griffmulde
  A(amtp_rbox(.20, .1, .006, .003), 'rauch', 0, .2, .142);                           // Sichtfenster
  A(amtp_rbox(.42, .04, .30, .01), 'plastikDunkel', 0, .52, 0);                      // Kopf, unten
  for (const sz of [-1, 1]) A(amtp_rbox(.42, .034, .142, .008), 'plastikDunkel', 0, .557, sz * .079);
  A(new THREE.BoxGeometry(.31, .002, .016), 'gummi', 0, .5405, 0);                  // Schlitzgrund
  A(amtp_rbox(.36, .006, .018, .003), 'plastikGrau', 0, .575, .11);                  // Zierleiste
  A(amtp_rbox(.056, .032, .014, .004), 'plastikGrau', .13, .52, .152);               // Schaltfeld
  A(amtp_rbox(.026, .014, .016, .004), 'plastikDunkel', .13, .52, .158);             // Wippschalter
  A(new THREE.BoxGeometry(.006, .004, .004), 'ledRot', .112, .538, .16); A(new THREE.BoxGeometry(.012, .005, .006), 'plastikDunkel', -.14, .575, .06);
  for (let i = 0; i < 9; i++) A(new THREE.BoxGeometry(.003, .018, .002), 'gummi', -.16 + i * .007, .52, .152);   // Lüftungsschlitze
  const G = amtp_baue(P);
  const sticker = amtp_schild(amt_cv(256, 64, (x, w, h) => { x.fillStyle = '#e9d34a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#1b1b1b'; x.lineWidth = 4; x.strokeRect(3, 3, w - 6, h - 6); x.fillStyle = '#1b1b1b'; x.font = 'bold 30px Arial'; x.fillText('Max. 8 Blatt!', 22, 44); }), .13, .034, { rough: .5 });
  sticker.rotation.x = -PI / 2; sticker.position.set(-.1, .5745 + .0006, .092); G.add(sticker);
  const st = new THREE.Group(); const cv = amt_cv(128, 256, (x, w, h) => { x.clearRect(0, 0, w, h); for (let i = 0; i < 9; i++) { x.fillStyle = `rgb(${224 - i * 3},${219 - i * 3},${200 - i * 3})`; const sx = 6 + i * 13, ln = h * amt_R(.45, 1); x.fillRect(sx, 0, 10, ln); x.fillStyle = 'rgba(30,30,30,.55)'; for (let y = 8; y < ln; y += 7) if (amt_R(0, 1) < .6) x.fillRect(sx + 1.5, y, 7, 1.6); } });
  const sm = new THREE.MeshStandardMaterial({ map: amt_tex(cv), color: 0x9a968a, roughness: .95, side: THREE.DoubleSide, alphaTest: .4 });
  for (const [dx, ry, s0] of [[-.1, .06, 1], [.0, -.04, .8], [.1, .1, .95]]) { const b = amtp_band([[0, .56, 0], [0, .585, .02], [0, .59, .06], [0, .57, .115], [0, .53, .163], [0, .45 * s0 + .06, .185], [0, .3 * s0 + .06, .19], [0, .2 * s0 + .06, .2]], .105, sm, { n: 34 }); b.position.x = dx; b.rotation.y = ry; st.add(b); }
  // Gekringelte Reste am Boden: dünne Papierröhren
  const rr = []; for (let i = 0; i < 26; i++) { const cx = amt_R(-.16, .16), cz = amt_R(.2, .46), pts = []; for (let k = 0; k < 6; k++) pts.push(new THREE.Vector3(cx + amt_R(-.07, .07), .004 + amt_R(0, .02), cz + amt_R(-.07, .07))); rr.push([new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, .0032, 4), 'papier', amtp_m()]); }
  G.add(amtp_baue(rr, { cast: false }));
  G.userData.streifen = st; G.add(st); return G; }
// ---- Filterkaffeemaschine mit Warmhalteplatte, Glaskanne (Satz am Boden), versteinertem Filter und Display „ENTKALKEN“: Front +z, Breite .24, Höhe .36
function amtp_kaffee() { const P = [], A = (g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => P.push([g, m, amtp_m(x, y, z, rx, ry, rz)]), zc = .045;
  A(amtp_rbox(.25, .034, .27, .01), 'plastikDunkel', 0, .017, 0);
  A(amtp_cyl(.082, .006, 28), 'stahl', 0, .037, zc); A(amtp_cyl(.07, .003, 28), 'plastikDunkel', 0, .0405, zc);          // Warmhalteplatte
  A(amtp_rbox(.23, .27, .095, .016), 'plastikDunkel', 0, .17, -.088);             // Säule
  A(amtp_rbox(.235, .085, .22, .016), 'plastikDunkel', 0, .31, -.02);             // Brühkopf
  A(amtp_rbox(.18, .008, .1, .004), 'plastikGrau', 0, .358, -.06);                // Deckelwulst
  A(amtp_cyl(.05, .014, 22, .056), 'plastikDunkel', 0, .258, zc);                 // Filterhalter
  A(amtp_cyl(.043, .052, 22, .034), 'plastikDunkel', 0, .228, zc);                // Filterkorb
  A(amtp_cyl(.0095, .02, 12), 'plastikDunkel', 0, .205, zc);                      // Auslauf
  A(amtp_rbox(.03, .014, .05, .005), 'plastikDunkel', .066, .258, zc + .045);     // Griff des Halters
  A(amtp_rbox(.07, .03, .01, .004), 'plastikGrau', -.07, .205, -.038);            // Tastenfeld
  A(amtp_rbox(.022, .012, .012, .004), 'plastikGrau', .02, .16, -.036); A(amtp_rbox(.022, .012, .012, .004), 'plastikGrau', .05, .16, -.036);
  A(new THREE.BoxGeometry(.006, .004, .004), 'ledRot', .085, .205, -.037);
  A(amtp_rbox(.012, .2, .006, .003), 'rauch', .095, .17, -.0405);                  // Wasserstandsstreifen
  // Kanne: Glas, Satz, Deckel, Henkel
  const gl = new THREE.MeshStandardMaterial({ color: 0xcfe0de, roughness: .05, metalness: 0, transparent: true, opacity: .32, depthWrite: false });
  A(amtp_cyl(.056, .17, 26, .05), gl, 0, .043 + .085, zc); A(amtp_cyl(.0535, .012, 26), amtp_kaffeeSatz(), 0, .05, zc);
  A(amtp_cyl(.058, .016, 26), 'plastikDunkel', 0, .221, zc); A(amtp_cyl(.026, .01, 14), 'plastikDunkel', 0, .234, zc);
  A(new THREE.TorusGeometry(.044, .0058, 7, 16, PI), 'plastikDunkel', .056, .12, zc, 0, 0, -PI / 2);
  const G = amtp_baue(P);
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(.1, .036), amt_decal(amt_cv(128, 46, (x, w, h) => { x.fillStyle = '#0c140e'; x.fillRect(0, 0, w, h); x.fillStyle = '#7dff9c'; x.font = 'bold 20px Courier New'; x.fillText('ENTKALKEN', 8, 31); x.strokeStyle = 'rgba(125,255,156,.25)'; x.strokeRect(1.5, 1.5, w - 3, h - 3); }), { em: 0xffffff, emI: 0, rough: .25 }));
  disp.position.set(0, .205, -.0405 + .0006); G.add(disp); G.userData.disp = disp;
  // Papierfilter, braun und hart (ragt aus dem Korb)
  { const f = new THREE.Mesh(new THREE.CylinderGeometry(.049, .03, .028, 22, 1, true), new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: .95, side: THREE.DoubleSide, bumpMap: amtp_noise(), bumpScale: 1 })); f.position.set(0, .274, zc); G.add(f); const fl = new THREE.Mesh(new THREE.RingGeometry(.047, .052, 22), new THREE.MeshStandardMaterial({ color: 0x75552f, roughness: 1, side: THREE.DoubleSide })); fl.rotation.x = -PI / 2; fl.position.set(0, .2888, zc); G.add(fl); }
  return G; }
function amtp_kaffeeSatz() { const k = 'kaffeesatz'; if (!AMTP.mats[k]) AMTP.mats[k] = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: .6, bumpMap: amtp_noise(), bumpScale: .8 }); return AMTP.mats[k]; }
// ---- Blechdose mit Münzschlitz und beklebtem Etikett „KAFFEEKASSE“ (ø 14 cm)
function amtp_dose() { const P = [], A = (g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => P.push([g, m, amtp_m(x, y, z, rx, ry, rz)]);
  A(amtp_cyl(.068, .098, 32), 'stahl', 0, .049, 0);
  for (const y of [.006, .092]) A(new THREE.TorusGeometry(.0685, .0036, 6, 32), 'stahl', 0, y, 0, PI / 2);
  A(amtp_cyl(.0715, .014, 32), 'stahl', 0, .1, 0); A(new THREE.TorusGeometry(.0715, .0032, 6, 32), 'stahlMatt', 0, .107, 0, PI / 2);
  A(new THREE.BoxGeometry(.05, .0016, .0052), 'gummi', 0, .1075, 0, 0, .25, 0);
  const G = amtp_baue(P);
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(.0692, .0692, .056, 36, 1, true), new THREE.MeshStandardMaterial({ roughness: .75, side: THREE.FrontSide, map: amt_tex(amt_cv(512, 128, (x, w, h) => { amt_rs = 71; x.fillStyle = '#7a1f19'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(225,200,120,.9)'; x.fillRect(0, 8, w, 3); x.fillRect(0, h - 11, w, 3);
    x.fillStyle = '#e9e2c8'; x.save(); x.translate(w * .5, h * .5); x.rotate(-.025); x.fillRect(-120, -34, 240, 68); x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(-120, 28, 240, 6); x.fillStyle = '#1d1c1a'; x.font = 'bold 36px "Special Elite", Courier New'; x.textAlign = 'center'; x.fillText('KAFFEEKASSE', 0, 12); x.restore();
    for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(0,0,0,${amt_R(.04, .16)})`; x.fillRect(amt_R(0, w), amt_R(0, h), 2, 1); } })), bumpMap: amtp_noise(), bumpScale: .3 }));
  lab.position.y = .052; lab.rotation.y = -PI / 2; lab.castShadow = false; G.add(lab); return G; }
// ---- Karteikasten (Blech, Deckel hochgeklappt, Karteikarten mit Reitern, Etikettenhalter)
function amtp_kartei(beschrift) { const P = [], A = (g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => P.push([g, m, amtp_m(x, y, z, rx, ry, rz)]);
  A(amtp_rbox(.34, .12, .2, .007), 'lack', 0, .06, 0);
  A(amtp_rbox(.325, .004, .185, .002), 'plastikDunkel', 0, .117, 0);
  { const lid = amtp_rbox(.34, .006, .2, .004); P.push([lid, 'lack', amtp_m(0, .125, -.1, 0, 0, 0).multiply(new THREE.Matrix4().makeRotationX(-1.92)).multiply(new THREE.Matrix4().makeTranslation(0, 0, .1))]); }
  for (const sx of [-1, 1]) A(amtp_cylX(.0045, .02, 8), 'stahl', sx * .12, .122, -.1);
  A(amtp_rbox(.096, .036, .005, .002), 'messing', 0, .06, .1);
  const cols = [0xb23a30, 0x3f6e9c, 0x5e8a46, 0xd6b13a], kard = [];
  for (let i = 0; i < 46; i++) { const z = -.088 + i * .0038, tl = amt_R(-.012, .012);
    kard.push([new THREE.BoxGeometry(.3, .092, .0016), 'papier', amtp_m(tl * .3, .122 + .018 + amt_R(-.006, .003), z, amt_R(-.04, .05), 0, amt_R(-.018, .018))]);
    if (i % 5 === 2) kard.push([new THREE.BoxGeometry(.034, .012, .0018), new THREE.MeshStandardMaterial({ color: cols[(i / 5 | 0) % 4], roughness: .7 }), amtp_m(-.12 + ((i / 5 | 0) % 6) * .05, .122 + .018 + .052, z, 0, 0, 0)]); }
  const G = amtp_baue(P.concat(kard));
  const lb = amtp_schild(amt_cv(256, 80, (x, w, h) => { x.fillStyle = '#e4ddc6'; x.fillRect(0, 0, w, h); x.fillStyle = '#1b1b1b'; x.font = 'bold 27px "Special Elite", Courier New'; x.textAlign = 'center'; x.fillText(beschrift || 'VERSUCHSREIHE K', w / 2, 50); }), .078, .024, { rough: .6 });
  lb.position.set(0, .06, .1026); G.add(lb); return G; }
// ---- Plastikdosen mit Schraubdeckel (Brotdosen), Deckel farbig mit Rippenrand; Kreppband „Do.“ auf jedem Deckel
function amtp_dosenTurm() { const G = new THREE.Group(), cols = [0x3a6aa8, 0x4f8a5c, 0xb8553a, 0x3a6aa8, 0x6a5aa0, 0x4f8a5c];
  const milch = new THREE.MeshStandardMaterial({ color: 0xe2e7df, roughness: .32, bumpMap: amtp_noise(), bumpScale: .25 });
  const tape = new THREE.MeshStandardMaterial({ roughness: .9, bumpMap: amtp_noise(), bumpScale: .4, map: amt_tex(amt_cv(128, 64, (x, w, h) => { x.fillStyle = '#e2d8ac'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,.2)'; x.fillRect(0, 0, w, 6); x.fillStyle = '#1f2a55'; x.font = '34px Caveat'; x.fillText('Do.', 38, 44); x.strokeStyle = 'rgba(120,100,50,.35)'; x.strokeRect(1, 1, w - 2, h - 2); })), polygonOffset: true, polygonOffsetFactor: -2 });
  for (let i = 0; i < 6; i++) { const col = (i % 2), row = (i / 2) | 0, P = [], A = (g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => P.push([g, m, amtp_m(x, y, z, rx, ry, rz)]);
    const lm = new THREE.MeshStandardMaterial({ color: cols[i], roughness: .45, bumpMap: amtp_noise(), bumpScale: .3 });
    A(amtp_cyl(.0565, .088, 28, .047), milch, 0, .044, 0); A(amtp_cyl(.0595, .018, 28), lm, 0, .097, 0); A(amtp_cyl(.0465, .004, 24), lm, 0, .108, 0);
    for (let k = 0; k < 28; k++) { const a = k / 28 * PI * 2; A(new THREE.BoxGeometry(.0035, .016, .0045), lm, Math.sin(a) * .0605, .097, Math.cos(a) * .0605, 0, a, 0); }
    const t = amtp_baue(P); const tp = new THREE.Mesh(new THREE.PlaneGeometry(.045, .02), tape); tp.rotation.x = -PI / 2; tp.rotation.z = amt_R(-.4, .4); tp.position.set(amt_R(-.006, .006), .1075 + .0007, amt_R(-.006, .006)); t.add(tp);
    t.position.set((col - .5) * .13 + amt_R(-.008, .008), row * .112, amt_R(-.008, .008)); t.rotation.y = amt_R(-.5, .5); t.rotation.z = amt_R(-.025, .025); G.add(t); }
  return G; }
// ---- Kaktus im Tontopf (Säulenkaktus mit Rippen, Dornenpolstern, Seitenarm, eine Blüte); Unterkante y = 0
function amtp_kaktus() { const G = new THREE.Group(), P = [], y0 = .011;
  const pot = [[.034, 0], [.046, 0], [.054, .08], [.063, .084], [.065, .102], [.058, .104], [.055, .092]].map(p => new THREE.Vector2(p[0], p[1])), pg = new THREE.LatheGeometry(pot, 32);
  const topfM = new THREE.MeshStandardMaterial({ roughness: .88, color: 0xffffff, side: THREE.DoubleSide, bumpMap: amtp_noise(), bumpScale: .9, map: amt_tex(amt_cv(256, 256, (x, w, h) => { amt_rs = 82; x.fillStyle = '#b3603a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${amt_R(90, 190) | 0},${amt_R(60, 110) | 0},${amt_R(40, 80) | 0},.18)`; x.fillRect(amt_R(0, w), amt_R(0, h), amt_R(1, 5), amt_R(1, 3)); }
    const g = x.createLinearGradient(0, 0, 0, h * .25); g.addColorStop(0, 'rgba(235,228,214,.55)'); g.addColorStop(1, 'rgba(235,228,214,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h * .25); for (let i = 0; i < 14; i++) { x.fillStyle = 'rgba(240,236,225,.28)'; x.fillRect(amt_R(0, w), amt_R(0, h * .6), amt_R(2, 8), amt_R(20, 80)); } })) });
  topfM.map.repeat.set(3, 1); const pm = new THREE.Mesh(pg, topfM); pm.position.y = y0; pm.castShadow = true; pm.receiveShadow = true; G.add(pm);
  const sa = amtp_baue([[amtp_cyl(.072, .011, 30, .062), 'ton', amtp_m(0, .0055, 0)]]); G.add(sa);
  P.push([new THREE.CylinderGeometry(.053, .053, .004, 24), 'erde', amtp_m(0, y0 + .0935, 0)]);
  const rib = (r0, h, ribs, seg) => { const rings = 20, pos = [], idx = [], ns = ribs * seg;
    for (let i = 0; i <= rings; i++) { const t = i / rings, yy = t * h, dome = t > .9 ? Math.sqrt(Math.max(0, 1 - Math.pow((t - .9) / .1, 2))) : 1, rr0 = r0 * (1 - .12 * t) * dome + .0005;
      for (let j = 0; j < ns; j++) { const a = j / ns * PI * 2, w = .5 + .5 * Math.cos(a * ribs), rr = rr0 * (.8 + .2 * Math.pow(w, .6)); pos.push(Math.cos(a) * rr, yy, Math.sin(a) * rr); } }
    for (let i = 0; i < rings; i++) for (let j = 0; j < ns; j++) { const a = i * ns + j, b = i * ns + (j + 1) % ns, c = (i + 1) * ns + j, d = (i + 1) * ns + (j + 1) % ns; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; };
  const ribs = 9, seg = 4, spineGeo = [], spine = (x, y, z, nx, nz) => { const an = Math.atan2(nz, nx); for (let k = 0; k < 5; k++) { const g = new THREE.CylinderGeometry(.00012, .0006, .0125, 3); g.translate(0, .00625, 0); g.rotateZ(PI / 2 - .25 - (k % 3) * .3); g.rotateY(PI - an + (k - 2) * .3); spineGeo.push([g, amtp_spineM(), amtp_m(x + nx * .0008, y, z + nz * .0008)]); } };
  P.push([rib(.04, .22, ribs, seg), 'gruen', amtp_m(0, y0 + .094, 0)]);
  for (let i = 1; i < 13; i++) { const t = i / 14, yy = y0 + .094 + t * .22, rr = .04 * (1 - .12 * t); for (let r = 0; r < ribs; r++) { const a = r / ribs * PI * 2; spine(Math.cos(a) * rr, yy, Math.sin(a) * rr, Math.cos(a), Math.sin(a)); } }
  P.push([rib(.024, .075, ribs, seg), 'gruen', amtp_m(.036, y0 + .19, 0, 0, 0, -PI / 2 + .18)]);
  P.push([rib(.024, .13, ribs, seg), 'gruen', amtp_m(.108, y0 + .198, 0, 0, 0, -.06)]);
  for (let i = 1; i < 6; i++) { const t = i / 6; for (let r = 0; r < ribs; r++) { const a = r / ribs * PI * 2, rr = .024 * (1 - .12 * t); spine(.108 - t * .13 * .06 + Math.cos(a) * rr, y0 + .198 + t * .13, Math.sin(a) * rr, Math.cos(a), Math.sin(a)); } }
  const bl = new THREE.MeshStandardMaterial({ color: 0xf0a8c4, roughness: .55, emissive: 0x321018, emissiveIntensity: .25, side: THREE.DoubleSide });
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2, pg2 = new THREE.PlaneGeometry(.014, .035); pg2.translate(0, .0175, 0); P.push([pg2, bl, amtp_m(Math.cos(a) * .008, y0 + .316, Math.sin(a) * .008, 0, -PI / 2 - a, 0).multiply(new THREE.Matrix4().makeRotationX(-.9))]); }
  P.push([new THREE.CylinderGeometry(.006, .004, .012, 8), new THREE.MeshStandardMaterial({ color: 0xe8c23a, roughness: .7 }), amtp_m(0, y0 + .322, 0)]);
  G.add(amtp_baue(P)); G.add(amtp_baue(spineGeo, { cast: false })); return G; }
function amtp_spineM() { const k = 'dorn'; if (!AMTP.mats[k]) AMTP.mats[k] = new THREE.MeshStandardMaterial({ color: 0xd8cfa8, roughness: .6 }); return AMTP.mats[k]; }
// ---- Nadeldrucker (Matrixdrucker, Endlospapier); Mitte x/z, Unterkante y = 0, Front +z, Breite .44
function amtp_drucker() { const P = [], A = (g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => P.push([g, m, amtp_m(x, y, z, rx, ry, rz)]);
  const W = .42, y0 = .008, hU = .075, yT = y0 + hU, zF = .12, zB = .03, hK = .055;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) A(amtp_cyl(.013, .008, 14), 'gummi', sx * .17, .004, sz * .14);
  A(amtp_rbox(W, hU, .38, .01), 'plastik', 0, y0 + hU / 2, 0);
  A(amtp_rbox(W - .03, .004, .365, .002), 'plastikGrau', 0, y0 + .002, 0);   // Bodenplatte
  for (const sx of [-1, 1]) A(amtp_prof([[zF, 0], [zF, .02], [zB, hK], [-.17, hK], [-.17, 0]], .022, .003), 'plastik', sx * (W / 2 - .011), yT, 0); // Wangen
  A(amtp_rbox(W - .02, hK, .205, .006), 'plastik', 0, yT + hK / 2, -.0675);   // Rückblock
  A(amtp_rbox(W - .03, .005, .32, .002), 'plastikGrau', 0, yT + hK + .0015, -.1, 0, 0, 0);
  const ang = Math.atan2(hK - .02, zF - zB), L = Math.hypot(zF - zB, hK - .02);
  A(new THREE.BoxGeometry(W - .046, .004, L), 'rauch', 0, yT + .02 + (hK - .02) / 2 + .002, (zF + zB) / 2, ang, 0, 0); // Rauchglasdeckel
  A(amtp_rbox(W - .046, .01, .006, .002), 'plastikGrau', 0, yT + .026, zF + .002);   // Deckelkante
  // Walze, Führungsstangen, Druckkopf, Farbband
  A(amtp_cylX(.017, W - .03, 22), 'gummi', 0, yT + .034, .068);
  for (const sx of [-1, 1]) { A(amtp_cylX(.023, .014, 20), 'plastik', sx * (W / 2 + .004), yT + .034, .068); A(amtp_cylX(.011, .012, 20), 'plastikGrau', sx * (W / 2 + .015), yT + .034, .068);
    for (let i = 0; i < 10; i++) A(new THREE.BoxGeometry(.016, .003, .004), 'plastikGrau', sx * (W / 2 + .004), yT + .034 + Math.cos(i * PI / 5) * .0235, .068 + Math.sin(i * PI / 5) * .0235, i * PI / 5); }
  A(amtp_cylX(.0035, W - .04, 10), 'chrom', 0, yT + .045, .098); A(amtp_cylX(.0035, W - .04, 10), 'chrom', 0, yT + .028, .098);
  A(amtp_rbox(.034, .028, .03, .004), 'plastikDunkel', -.07, yT + .037, .098); A(amtp_rbox(.026, .006, .012, .002), 'stahl', -.07, yT + .052, .1);
  A(amtp_rbox(.16, .02, .012, .004), 'plastikDunkel', -.07, yT + .045, .078); // Farbbandkassette
  for (const sx of [-1, 1]) A(amtp_rbox(.02, .02, .05, .003), 'stahlMatt', sx * (W / 2 - .03), yT + .021, .05); // Traktoren
  A(amtp_rbox(.30, .006, .012, .002), 'stahl', 0, yT + hK - .004, zB - .002);    // Abreißkante
  A(amtp_rbox(.20, .003, .006, .001), 'plastikDunkel', 0, yT + hK + .004, -.145); // Papiereinzug (Schlitz hinten)
  // Bedienfeld vorn rechts
  A(amtp_rbox(.115, .006, .052, .003), 'plastikDunkel', .1, yT + .003, .152);
  for (let i = 0; i < 4; i++) A(amtp_rbox(.02, .006, .016, .0025), 'plastikGrau', .066 + i * .025, yT + .008, .157);
  A(new THREE.BoxGeometry(.006, .003, .006), 'ledGruen', .151, yT + .0075, .137); A(new THREE.BoxGeometry(.006, .003, .006), 'ledRot', .136, yT + .0075, .137);
  A(amtp_rbox(.02, .008, .012, .003), 'plastikGrau', W / 2 - .002, y0 + .05, .12, 0, 0, 0); // Netzschalter seitlich
  const G = amtp_baue(P);
  const lab = amtp_schild(amt_cv(256, 64, (x, w, h) => { x.fillStyle = '#d9d4c2'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2b2a'; x.font = 'bold 9px Arial'; ['ON LINE', 'FORM FEED', 'LINE FEED', 'TOF'].forEach((t, i) => x.fillText(t, 6 + i * 62, 24)); x.font = '8px Arial'; x.fillText('POWER', 6 + 3.2 * 62, 54); x.fillText('ERROR', 6 + 2.2 * 62, 54); }), .115, .028, { rough: .5 });
  lab.rotation.x = -PI / 2; lab.position.set(.1, yT + .0066, .134); G.add(lab);
  const fr = amtp_schild(amt_cv(512, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#17181a'; for (let i = 0; i < 14; i++) x.fillRect(30 + i * 8, 40, 4, 44); x.fillStyle = '#b6b7b2'; x.fillRect(w - 170, 30, 140, 40); x.fillStyle = '#222'; x.font = 'bold 22px Arial'; x.fillText('MATRIX 80', w - 160, 60); x.fillStyle = '#7a1c14'; x.fillRect(w - 170, 74, 140, 5); }), .30, .075, { alpha: true, rough: .5 });
  fr.position.set(-.04, y0 + hU / 2, .1915); G.add(fr);
  return G; }
// Endlospapier-Stapel (Leporello, Grünstreifen) mit Lochrand
function amtp_stapel(w, h, d) { const c = amt_cv(512, 256, (x, W, H) => { amt_rs = 33; x.fillStyle = '#e4e2d2'; x.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 6) { x.fillStyle = (y / 6) % 2 ? 'rgba(200,215,190,.55)' : 'rgba(255,255,255,.25)'; x.fillRect(0, y, W, 3); x.fillStyle = 'rgba(70,70,60,.30)'; x.fillRect(0, y, W, 1); }
    x.fillStyle = 'rgba(40,40,36,.55)'; for (let y = 3; y < H; y += 12) { x.beginPath(); x.arc(9, y, 2.4, 0, 7); x.fill(); x.beginPath(); x.arc(W - 9, y, 2.4, 0, 7); x.fill(); } x.fillStyle = 'rgba(120,100,60,.12)'; x.fillRect(0, 0, W, H * .06); });
  const t = amt_tex(c), m = new THREE.MeshStandardMaterial({ map: t, roughness: .95 }), top = new THREE.MeshStandardMaterial({ color: 0xe9e6d8, roughness: .95 });
  const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [m, m, top, top, m, m]); g.castShadow = true; g.receiveShadow = true; return g; }
// Rollwagen: Stahltabletts, vier Rollen, Schiebebügel (Front +z, Maße wie der Druckerwagen)
function amtp_wagen(W = .72, D = .46, hTop = .8) { const P = [], A = (g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => P.push([g, m, amtp_m(x, y, z, rx, ry, rz)]);
  const tray = (y) => { A(amtp_rbox(W, .02, D, .006), 'stahlMatt', 0, y, 0); for (const [w, d, x, z] of [[W, .012, 0, D / 2 - .006], [W, .012, 0, -D / 2 + .006], [.012, D, W / 2 - .006, 0], [.012, D, -W / 2 + .006, 0]]) A(amtp_rbox(w, .03, d, .004), 'stahlMatt', x, y + .02, z); };
  tray(hTop - .01); tray(.22);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = sx * (W / 2 - .035), z = sz * (D / 2 - .035); A(amtp_cyl(.0125, hTop - .1, 14), 'chrom', x, .09 + (hTop - .1) / 2, z);
    A(amtp_cyl(.018, .012, 14), 'stahlMatt', x, .1, z); A(amtp_cyl(.006, .03, 8), 'stahl', x, .075, z); A(amtp_rbox(.012, .05, .04, .002), 'stahl', x, .05, z + sz * 0); A(amtp_cylX(.034, .022, 18), 'gummi', x, .036, z); A(amtp_cylX(.014, .028, 12), 'stahl', x, .036, z); }
  for (const sx of [-1, 1]) A(amtp_cyl(.0105, .24, 12), 'chrom', sx * (W / 2 - .06), hTop + .1, -D / 2 + .02); A(amtp_cylX(.0115, W - .12 + .021, 12), 'chrom', 0, hTop + .22, -D / 2 + .02);
  for (const sx of [-1, 1]) A(amtp_cylZ(.0095, .06, 10), 'chrom', sx * (W / 2 - .06), hTop + .04, -D / 2 - .01);
  return amtp_baue(P); }

// ---------------------------------------------------------------- Klänge (synthetisch, positioniert; keine Allokation pro Bild – nur bei Ereignissen)
function amt_nadel(x, y, z, zeilen = 1, v = 1) { const A = Audio; if (!A.ctx) return; if (A.buf.fx_nadel_2) { for (let l = 0; l < zeilen; l++) { A.play(A.pick('fx_nadel_1', 'fx_nadel_2'), { gain: .5 * v, delay: l * 1.35, x, y, z, ref: 3 }); A.play('fx_nadel_servo', { gain: .3 * v, delay: l * 1.35 + 1.0, x, y, z, ref: 3 }); } return; } /* echter Nadeldrucker (Aufnahme) */ const t = A.ctx.currentTime, d0 = A.at(x, y, z, 3);
  try { for (let l = 0; l < zeilen; l++) { for (let i = 0; i < 30; i++) { const d = l * 1.35 + i * .031 + Math.random() * .007, n = A.noise(false), bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400 + Math.random() * 1100; bp.Q.value = 5; n.connect(bp); A.env(bp, .05 * v, .002, .02, d, d0); n.stop(t + d + .1); }
      const n2 = A.noise(false), bp2 = A.ctx.createBiquadFilter(); bp2.type = 'bandpass'; bp2.frequency.value = 700; bp2.Q.value = 2; n2.connect(bp2); A.env(bp2, .04 * v, .05, .25, l * 1.35 + 1.0, d0); n2.stop(t + l * 1.35 + 1.5); } // Wagenrücklauf
  } catch (e) {} }
function amt_klick(x, y, z) { try { Audio.play('switch2', { gain: .35, rate: rand(.7, .9), x, y, z, ref: 3 }); } catch (e) {} }
function amt_kratzen(x, y, z, n = 3, v = 1) { for (let i = 0; i < n; i++) setTimeout(() => { try { Audio.play(Audio.pick('scrape2', 'scrape3'), { gain: .16 * v, rate: rand(.55, .75), dur: 1.3, x, y, z, ref: 2.5 }); } catch (e) {} }, i * 1700 + rand(0, 300)); }
// Lucys Melodie, gesummt (keine Spieluhr darunter): Sinus mit Vibrato und weichen Formanten, ganz leise, aus der Tiefe
function amt_summen(x, y, z, gain = .05, tempo = 1) { const A = Audio; if (!A.ctx) return; const c = A.ctx, t0 = c.currentTime + .1, d = A.at(x, y, z, 6), notes = [329.6, 293.7, 261.6, 246.9, 261.6, 293.7, 329.6, 329.6];
  if (A.stimmNote && A.buf.fx_summ_1) { let tt = .1; notes.forEach((f, i) => { const len = (i === 4 || i === 7 ? 1.1 : .62) / tempo; A.stimmNote('summ', f, tt, len, gain * 4.5, d); tt += len; }); return; } // echte Summ-Töne (freesound CC0)
  try { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.connect(d); let t = t0;
    notes.forEach((f, i) => { const len = (i === 4 || i === 7 ? 1.1 : .62) / tempo; const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), vib = c.createOscillator(), vg = c.createGain();
      o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2.002; vib.frequency.value = 5.2; vg.gain.value = f * .006; vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
      const g2 = c.createGain(); g2.gain.value = .18; o2.connect(g2); o.connect(g); g2.connect(g); g.connect(lp); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .12); g.gain.setValueAtTime(gain, t + len - .12); g.gain.linearRampToValueAtTime(0, t + len);
      for (const q of [o, o2, vib]) { q.start(t); q.stop(t + len + .05); } t += len + .04; }); } catch (e) {} }

// ---------------------------------------------------------------- Nadeldrucker (Archiv, Rollwagen) – druckt jeden Schritt von „Rückläufer 08“
const AMT_DRUCK = { x: C2.x + 27.6, y: .95, z: C2.z - 2.35 };
// Story-Prüfung W-1: bis Akte 08 heißt Luke im Protokoll „VORGANG 08“; danach einmal die Korrektur (amt_akte08), dann nur noch „RÜCKLÄUFER 08“
function amt_druck(text, o = {}) { const S = amt_S; if (!ch2.on) return; if (!S.akte8) text = String(text).replace(/^RÜCKLÄUFER 08/, 'VORGANG 08'); S.q.push([text, o]); }
function amt_druckJetzt(text, o) { const S = amt_S, P = o.mess ? S.messDruck : AMT_DRUCK, zeile = 'ZÄHLSCHLUSS 03:13 · ' + text; S.druckZ.push(zeile); if (S.druckZ.length > 40) S.druckZ.shift();
  amt_nadel(P.x, P.y, P.z, 1, o.mess ? 1.1 : 1); amt_papierNeu(); S.druckT = 2.2;
  const nah = amt_nah(P.x, P.z, 7); if (o.still) return;
  setTimeout(() => { if (state.talking && !o.immer) return; subtitle(nah ? `Der Nadeldrucker rattert: „${zeile}“` : `${o.mess ? 'Hinter dir' : 'Im Archiv'} rattert ein Nadeldrucker: „${zeile}“`, 5200); }, 700); }
function amt_papierNeu() { const S = amt_S; if (!S.papierCtx) return; const x = S.papierCtx, w = 256, h = 1216; x.clearRect(0, 0, w, h); amt_rs = 404; amt_papier(x, w, h, { bg: '#e7e2d2', flecken: 3 });
  x.fillStyle = 'rgba(80,70,60,.35)'; for (let y = 6; y < h; y += 22) { x.beginPath(); x.arc(9, y, 3.5, 0, 7); x.fill(); x.beginPath(); x.arc(w - 9, y, 3.5, 0, 7); x.fill(); } // Lochrand
  x.fillStyle = '#26221e'; x.font = '12px "Courier New", monospace'; const L = S.druckZ.slice(-26).reverse(); L.forEach((z, i) => { const y = 430 + i * 29; x.globalAlpha = i === 0 ? .95 : .62; /* neueste Zeile am Austritt, ältere weiter unten am Band */ x.fillText(z.slice(0, 30), 22, y); if (z.length > 30) x.fillText(z.slice(30, 60), 22, y + 13); }); x.globalAlpha = 1;
  S.papierTex.needsUpdate = true; }

// ---------------------------------------------------------------- Lautsprecher: Wolters Bandschleife (AG-05), von ihr verstellt
const AMT_BOXEN = [[C2.x + 9, 2.3, C2.z + 1.84, PI], [C2.x + 24, 2.3, C2.z + 5.84, PI], [C2.x + 35.4, 2.3, C2.z + 7.84, PI], [C2.x + 41, 2.3, C2.z - 4.84, 0], [C2.x + 76, 2.3, C2.z + 1.84, PI], [C2.x + 108, 2.3, C2.z - 7.84, 0], [C2.x + 116, 2.3, C2.z - 7.84, 0]]; // [x, y, z (Wandfläche), Blickrichtung]
function amt_box0() { const P = player.pos; let b = AMT_BOXEN[0], d = 1e9; for (const q of AMT_BOXEN) { const e = (q[0] - P.x) ** 2 + (q[2] - P.z) ** 2; if (e < d) { d = e; b = q; } } return b; }
// text: „…“ ohne Anführungszeichen; o.schnitte: Teile mit Schnitt dazwischen (Raumklang wechselt hörbar), o.spieluhr: Lucys Spieluhr leise darunter, o.kichern
async function amt_band(text, o = {}) { const S = amt_S; while (S.band) await wait(200); S.band = true;
  try { const [bx, by, bz] = o.at || amt_box0(); Audio.intercomClick && Audio.intercomClick(bx, by, bz); await wait(420);
    const teile = o.schnitte || [text];
    for (let i = 0; i < teile.length; i++) { const t = teile[i]; if (i > 0) { amt_klick(bx, by, bz); await wait(120 + Math.random() * 160); }
      const ms = Math.max(900, 900 + t.length * 55); if (o.spieluhr && typeof lucy3_tines === 'function') try { lucy3_tines(ms / 1000 + .3, Audio.at(bx, by, bz, 3), .5); } catch (e) {}
      if (typeof lwo_zeile === 'function') await lwo_zeile('BAND', '„' + t + '“', { ms: ms - 1300 > 0 ? ms : 0 }, { funkAt: { x: bx, z: bz } }); else { subtitle('„' + t + '“', ms, 'LAUTSPRECHER'); await wait(ms); } }
    if (o.kichern) { await wait(250); Audio.giggle(bx, by, bz); }
  } finally { S.band = false; } }

// ---------------------------------------------------------------- Türen in Wänden entlang z (Achse 'z': Wand x = konst.) oder x; Blatt = Scan-Tür
function amt_tuer(K, x, z, achse, w, label, o = {}) {
  const piv = new THREE.Group(); scene.add(piv); const g = K ? amt_einzel(K, 0, 0, 0) : null;
  if (g) { scene.remove(g); piv.add(g); g.scale.set(1, 1, 1); const b = new THREE.Box3().setFromObject(g), s = b.getSize(new THREE.Vector3()); g.scale.set((w - .04) / s.x, 2.08 / s.y, .05 / s.z); g.updateMatrixWorld(true); const b2 = new THREE.Box3().setFromObject(g); g.position.set(-b2.min.x + .02, -b2.min.y, -(b2.min.z + b2.max.z) / 2); }
  if (achse === 'z') { piv.position.set(x, 0, z - w / 2); piv.rotation.y = -PI / 2; } else { piv.position.set(x - w / 2, 0, z); }
  const col = achse === 'z' ? addCol(x - .08, x + .08, z - w / 2, z + w / 2) : addCol(x - w / 2, x + w / 2, z - .08, z + .08); const saved = { ...col };
  const base = piv.rotation.y, D = { piv, col, open: false, locked: !!o.locked, label, dir: o.dir || 1 };
  D.set = on => { D.open = on; tween(piv, { ry: base + (on ? 1.45 * D.dir : 0) }, on ? .9 : .45); if (on) col.minX = col.maxX = -9999; else { Object.assign(col, saved); doorPushOut(col); }
    try { if (Audio.doorSound) Audio.doorSound(on, x, z); else Audio.creak(.2, x, 1.2, z); } catch (e) {} };
  const hitW = achse === 'z' ? [.2, 2.1, w] : [w, 2.1, .2]; const hit = amt_hit(x, 1.05, z, ...hitW, () => D.locked ? label : D.open ? 'Tür schließen' : 'Tür öffnen', () => {
    if (D.locked) { if (o.zu) return o.zu(D); return toast('Abgeschlossen.', 2000); } if (D.open && amt_nah(x, z, .55)) return toast('Du stehst in der Tür.', 1600); D.set(!D.open); });
  D.hit = hit; return D; }

// =====================================================================  AUFBAU
WORLD_MODS.push(['Amt Ebene −2', async () => {
  const S = amt_S, X0 = C2.x, Z0 = C2.z, H = C2.h;
  try { await document.fonts.load('40px Caveat'); await document.fonts.load('30px "Special Elite"'); } catch (e) {}
  const surf = (key, tint, tile = 2, nrm = 1) => { const m = msSurfMat(key, { tint, nrm }); m.userData.tile = tile; return m; };
  const putz = surf('wall_plaster', 0xb1a996, 2), sockel = surf('wall_damaged', 0x6c786a, 2.4, .8), boden = surf('floor_worn', 0x80786a, 2.2), decke = surf('facade_concrete', 0x5f5c56, 2.5);
  const linie = new THREE.MeshStandardMaterial({ color: 0x28302a, roughness: .6 }); boden.roughness = 1;
  const batch = new Batch();
  const face = (mat, x, y, z, w, h, ry, tile = 2, u0 = 0) => { const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w + u0) / tile, (uv.getY(i) * h + y - h / 2) / tile); batch.add(g, mat, mtx(x, y, z, ry)); };
  // Innenseite einer Wand: Putz oben, Ölsockel unten (1,3 m), dunkle Trennlinie; tueren: [[von, bis], …] längs der Wand
  const innen = (achse, fest, a, b, ry, tueren = []) => { const DA = 1.3; let cur = a; const seg = (s, e) => { if (e - s < .02) return; const w = e - s, c = (s + e) / 2, px = achse === 'x' ? c : fest, pz = achse === 'x' ? fest : c;
      face(putz, px, DA + (H - DA) / 2, pz, w, H - DA, ry, 2, s); face(sockel, px, DA / 2, pz, w, DA, ry, 2.4, s); face(linie, px, DA, pz, w, .025, ry); };
    for (const [s, e] of tueren.slice().sort((p, q) => p[0] - q[0])) { seg(cur, s); const c = (s + e) / 2; face(putz, achse === 'x' ? c : fest, 2.2 + (H - 2.2) / 2, achse === 'x' ? fest : c, e - s, H - 2.2, ry, 2, s); cur = e; } seg(cur, b); };
  const raum = (x0, x1, z0, z1) => { plane(x1 - x0, z1 - z0, (x0 + x1) / 2, .011, (z0 + z1) / 2, boden); box(x1 - x0 + .3, .2, z1 - z0 + .3, (x0 + x1) / 2, H + .1, (z0 + z1) / 2, decke, { cast: false }); };
  // Basiswände finden und ausblenden (samt Kollision), um sie mit Türöffnungen neu zu bauen
  const wandWeg = pred => { const L = msFind((o, bb) => o.geometry && o.geometry.type === 'BoxGeometry' && pred(o, bb)); L.forEach(msHide); return L.length; };
  S.build = { surf, putz, sockel, boden, decke, batch, face, innen, raum, wandWeg };

  // ---------------------------------------------------------------- Modelle
  const [kTisch, kStuhl, kSchrank, kRegal, kSack, kEimer, kRoehre, kRadio, kRahmen, kUhr, kTuer, kFunk, kTelefon, kThermos, kBlech, kBecher, kKette, kLeiter, kBatt, kAscher, kUrne, kSchuppe, kSchuppe2, kHalte] = await Promise.all([
    amt_kit('metaltable', 'model.gltf', 3.0, 'x'), amt_kit('chair', 'model.fbx', .93, 'y', { '*': { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg' } }),
    amt_kit('aktenschrank', 'archiv_grau.glb', 1.95).then(k => k || amt_kit('wardrobe', 'model.gltf', 1.95)), amt_kit('shelf', 'model.gltf', .85, 'x'), amt_kit('trashbag', 'model.gltf', .68, 'x'), amt_kit('trashcan', 'model.gltf', .59),
    amt_kit('crt', 'model.glb', .37, 'x'), amt_kit('radio', 'model.gltf', .42, 'x'), amt_kit('frame_deco', 'model.gltf', .5), amt_kit('wallclock', 'model.gltf', 1.05), amt_kit('door1', 'model.gltf', 2.02),
    amt_kit('w_funk', 'model.glb', .34, 'max'), amt_kit('w_telefon', 'model.glb', .22, 'max'), amt_kit('w_thermos', 'model.glb', .31), amt_kit('w_blech', 'model.glb', .32, 'max'), amt_kit('w_becher', 'model.glb', .1),
    amt_kit('w_kette', 'model.glb', .62, 'max'), amt_kit('../ue/leiter', 'model.glb', 2.35, 'lang'), amt_kit('../ue/batterie', 'model.glb', .06, 'max'), amt_kit('kiffen/ascher', 'model.glb', .13, 'max'), amt_kit('w_urne', 'model.glb', .3),
    amt_kit('shed_garden', 'model.glb', .075), amt_kit('shed_old', 'model.gltf', .08), null]); // kHalte: die Tankstelle wird in amt_bauPlanung aus Teilen gebaut (gas_retro bleibt aus der Veröffentlichung draußen)
  for (const K of [kSack, kEimer, kRoehre, kRadio, kRahmen, kBecher, kBatt, kAscher, kSchuppe, kSchuppe2, kHalte, kTelefon, kBlech, kThermos]) if (K) K.shadow = false;
  // 08.10.2026 (Nutzer: „Holz-Kleiderschränke statt Aktenschränke“): eigene Metallschränke (Blender, tools/blender/schrank_bau.py) – Archivschrank grau/grün, Hängeregistratur grau/oliv/beige
  const metall = kSchrank && kSchrank.key === 'aktenschrank';
  const [kSchrankGruen, kAkte1, kAkte2, kAkte3] = await Promise.all([amt_kit('aktenschrank', 'archiv_gruen.glb', 1.95), amt_kit('aktenschrank', 'akte_grau.glb', 1.32), amt_kit('aktenschrank', 'akte_oliv.glb', 1.32), amt_kit('aktenschrank', 'akte_beige.glb', 1.32)]);
  const kSchrankStahl = metall ? (kSchrankGruen || kSchrank) : amt_variant(kSchrank, m => { const n = m.clone(); n.color = new THREE.Color(0x9aa39a); n.metalness = .35; n.roughness = .55; return n; });
  const kAkten = [kAkte1, kAkte2, kAkte3].filter(Boolean);
  // Schrankplatz (≈ 1 m): zwei Hängeregistraturschränke nebeneinander, sonst Archivschrank; Farben wechseln
  const amt_schrankPlatz = (x, z, o, i) => { if (kAkten.length >= 2) { amt_put(kAkten[i % kAkten.length], x - .245, z, o); amt_put(kAkten[(i + 1) % kAkten.length], x + .245, z, o); } else amt_put(kSchrankStahl, x, z, o); };
  const amt_archivPlatz = (x, z, o, i) => amt_put(i % 2 && metall ? kSchrank : kSchrankStahl, x, z, o);
  const kKuehl = amt_variant(kSchrank, m => { const n = m.clone(); n.map = null; n.color = new THREE.Color(0xa9aeaa); n.metalness = .75; n.roughness = .32; return n; });
  const kUrneGrau = amt_variant(kUrne, m => { const n = m.clone(); n.color = new THREE.Color(0x8c8f8a); return n; });
  const kFolie = amt_variant(kSchuppe2, m => { const n = m.clone(); n.map = null; n.color = new THREE.Color(0xd8dcdf); n.metalness = 1; n.roughness = .22; return n; }); // Nr. 3 mit Alufolie
  const kModellKirche = await amt_kit('chapel', 'model.fbx', .11, 'y', Object.fromEntries(['u1_v1', 'u2_v1', 'u3_v1', 'u1_v2', 'u2_v2'].map(k => ['kaplicka_' + k, { b: 'kaplicka_' + k + '.jpg', rough: .92 }])));
  S.K = { amt_schrankPlatz, amt_archivPlatz, kAkten, kTisch, kStuhl, kSchrank, kSchrankStahl, kRegal, kSack, kEimer, kRoehre, kRadio, kRahmen, kUhr, kTuer, kFunk, kTelefon, kThermos, kBlech, kBecher, kKette, kLeiter, kBatt, kAscher, kUrne, kUrneGrau, kSchuppe, kSchuppe2, kHalte, kFolie, kModellKirche, kKuehl };
  for (const [n, f] of [['Tunnel', amt_bauTunnel], ['Archiv', amt_bauArchiv], ['Kantine', amt_bauKantine], ['Registratur', amt_bauRegistratur], ['Sicherungsraum', amt_bauSicherung], ['Planungsraum', amt_bauPlanung], ['Prüfraum', amt_bauPruef], ['Gang', amt_bauGang], ['Vorraum', amt_bauVorraum], ['Messraum', amt_bauMessraum]])
    try { await f(S, S.K); } catch (e) { console.warn('amt: Aufbau ' + n, e); }
  batch.flush(scene, false); amt_flush(); try { amt_akte06(); } catch (e) { console.warn('amt: Akte 06', e); } try { amt_zeichen(); } catch (e) {}
  S.ready = true; amt_nachLaden();
}]);

// ================================================================ TUNNEL: Schild, Dienstanweisung, Wartebereich, Bahnhofsuhr, Nummernautomat, Lautsprecher, Handabdrücke
async function amt_bauTunnel(S, K) {
  const X0 = C2.x, Z0 = C2.z, zN = Z0 + 1.845, zS = Z0 - 1.845;
  // Schild der Bundesstelle (Email statt Pappe)
  if (typeof tunnelSign !== 'undefined') { const c = echt_an(() => amt_cv(1024, 440, (x, w, h) => { amt_rs = 71; x.fillStyle = '#233a2e'; x.fillRect(0, 0, w, h); x.fillStyle = '#e9e2cc'; x.fillRect(14, 14, w - 28, h - 28); x.fillStyle = '#233a2e'; x.fillRect(26, 26, w - 52, h - 52);
      x.fillStyle = '#ece5cf'; x.textAlign = 'center'; x.font = 'bold 74px Arial'; x.fillText('BUNDESSTELLE', w / 2, 128); x.fillText('FÜR RÜCKFÜHRUNG', w / 2, 212); x.font = '38px Arial'; x.fillText('Außenstelle Lost Eyengless · Ebene −2', w / 2, 292);
      amt_auge(x, w - 92, h - 84, 22, 'rgba(236,229,207,.7)'); // klein, wie ein Druckfehler
      for (let i = 0; i < 26; i++) { const px = amt_R(0, w), py = amt_R(0, 1) < .6 ? amt_R(0, 30) : amt_R(h - 30, h), r = amt_R(4, 16); x.fillStyle = '#16140f'; x.beginPath(); x.ellipse(px, py, r, r * amt_R(.5, 1), amt_R(0, 3), 0, 7); x.fill(); x.fillStyle = 'rgba(120,60,20,.45)'; x.beginPath(); x.arc(px, py + r, r * .8, 0, 7); x.fill(); }
      for (let i = 0; i < 12; i++) { const px = amt_R(40, w - 40), g = x.createLinearGradient(0, 300, 0, h); g.addColorStop(0, 'rgba(90,40,10,0)'); g.addColorStop(1, 'rgba(90,40,10,.4)'); x.fillStyle = g; x.fillRect(px, 300, amt_R(3, 8), h - 300); } }), 'sauber');
    tunnelSign.material.map = amt_tex(c); tunnelSign.material.map.repeat.set(1, 1); tunnelSign.material.map.offset.set(0, 0); tunnelSign.material.roughness = .45; tunnelSign.material.metalness = .15; tunnelSign.material.needsUpdate = true;
    tunnelSign.scale.set(1, .86, 1); tunnelSign.position.y = 1.8;
    amt_hit(tunnelSign.position.x - .1, 1.8, tunnelSign.position.z, .15, .5, 1.2, 'Schild', () => toast('„Bundesstelle für Rückführung · Außenstelle Lost Eyengless · Ebene −2“. Unten rechts, klein, wie ein Druckfehler: ein Kreis, darin ein Auge über einer Flamme.', 5200)); }
  // Dienstanweisung (gerahmt): SEHEN · BERGEN · SCHWEIGEN
  const da = amt_cv(512, 700, (x, w, h) => { amt_rs = 73; amt_papier(x, w, h, { bg: '#c9c6bd' }); x.fillStyle = '#1e1d1b'; x.textAlign = 'center'; x.font = 'bold 26px "Special Elite", Courier New'; x.fillText('DIENSTANWEISUNG', w / 2, 90);
    x.font = 'bold 44px "Special Elite", Courier New'; x.fillText('SEHEN · BERGEN', w / 2, 220); x.fillText('SCHWEIGEN', w / 2, 280); x.font = '30px "Special Elite", Courier New';
    ['Wer sieht, meldet.', 'Wer birgt, zählt.', 'Wer schweigt, schützt.'].forEach((t, i) => x.fillText(t, w / 2, 390 + i * 58)); amt_auge(x, w / 2, 610, 30, 'rgba(30,29,27,.8)'); });
  amt_put(K.kRahmen, X0 + 13.6, 0, { ry: PI, y: 1.08, maxZ: zN }); amt_flaeche(amt_decal(da), X0 + 13.6, 1.33, zN - .04, .3, .41, PI);
  amt_hit(X0 + 13.6, 1.3, zN - .1, .45, .6, .15, 'Dienstanweisung', () => amt_note('Dienstanweisung', '<b>SEHEN · BERGEN · SCHWEIGEN.</b>\n\nWer sieht, meldet.\nWer birgt, zählt.\nWer schweigt, schützt.', 'da_tunnel'));
  // Wartebereich (AG-05: „Begleitpersonen warten im Wartebereich“): Stühle an der Nordwand, Aschenbecher, Hinweis
  for (let i = 0; i < 4; i++) amt_put(K.kStuhl, X0 + 2.4 + i * .72, 0, { ry: PI + amt_R(-.12, .12), maxZ: zN - .05 });
  amt_put(K.kAscher, X0 + 5.3, zN - .35, { ry: .4, y: 0 }); amt_put(K.kSack, X0 + 6.3, 0, { ry: 2.2, s: .75, maxZ: zN - .02 });
  const warte = amt_cv(512, 256, (x, w, h) => { amt_rs = 75; amt_papier(x, w, h, { bg: '#e4dec9' }); x.fillStyle = '#1d1c1a'; x.textAlign = 'center'; x.font = 'bold 34px Arial'; x.fillText('WARTEBEREICH', w / 2, 70); x.font = '24px Arial'; x.fillText('Bitte warten Sie, bis Ihre', w / 2, 128); x.fillText('Nummer aufgerufen wird.', w / 2, 162); amt_auge(x, w - 40, h - 36, 16); });
  amt_flaeche(amt_decal(warte), X0 + 3.5, 1.55, zN - .02, .6, .3, PI);
  // Bahnhofsuhren (Tunnel, Archiv, über der Messraumtür): Zifferblatt + zwei Zeiger
  const uhr = amt_cv(512, 512, (x, w) => { x.clearRect(0, 0, w, w); const c = w / 2; x.fillStyle = '#20231f'; x.beginPath(); x.arc(c, c, 252, 0, 7); x.fill(); x.fillStyle = '#ecebe4'; x.beginPath(); x.arc(c, c, 232, 0, 7); x.fill();
    const g = x.createRadialGradient(c - 60, c - 80, 20, c, c, 240); g.addColorStop(0, 'rgba(255,255,255,.3)'); g.addColorStop(1, 'rgba(90,80,60,.25)'); x.fillStyle = g; x.beginPath(); x.arc(c, c, 232, 0, 7); x.fill();
    x.fillStyle = '#141414'; for (let i = 0; i < 60; i++) { const a = i / 60 * PI * 2, big = i % 5 === 0; x.save(); x.translate(c, c); x.rotate(a); x.fillRect(-(big ? 7 : 2.5), -218, big ? 14 : 5, big ? 52 : 18); x.restore(); } });
  const zeiger = (len, br) => amt_cv(64, 512, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#121212'; x.fillRect(w / 2 - br / 2, h / 2 - len, br, len + 30); });
  const uhrMat = amt_decal(uhr, { rough: .35 }), minM = amt_decal(zeiger(230, 14)), stdM = amt_decal(zeiger(150, 20));
  const mkUhr = (x, y, z, ry, d, dx, dz) => ({ m: amt_flaeche(uhrMat, x, y, z, d, d, ry), min: amt_flaeche(minM, x + dx, y, z + dz, d * .125, d, ry), std: amt_flaeche(stdM, x + dx * 2, y, z + dz * 2, d * .125, d, ry), x, y, z });
  S.uhren = [mkUhr(X0 + 10.2, 2.06, zN - .03, PI, .36, 0, -.004), mkUhr(X0 + 29.83, 2.22, Z0 - 1.6, -PI / 2, .3, -.004, 0), mkUhr(X0 + 110.17, 2.36, Z0, PI / 2, .26, .004, 0)];
  S.uhrMin = 1 * 60 + 4; amt_uhrStellen();
  // Nummernautomat (Südwand): Knopf, Schlitz; daneben drei parallele Kratzer in Kinderhöhe (Beobachter)
  const nx = X0 + 15.4, nz = zS + .025;
  const auto = amt_cv(256, 400, (x, w, h) => { amt_rs = 77; const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#6f746e'); g.addColorStop(.5, '#8d928b'); g.addColorStop(1, '#5d625c'); x.fillStyle = g; x.fillRect(8, 8, w - 16, h - 16);
    x.strokeStyle = '#2b2e2a'; x.lineWidth = 6; x.strokeRect(8, 8, w - 16, h - 16); x.fillStyle = '#e8e2cd'; x.fillRect(30, 40, w - 60, 90); x.fillStyle = '#1b1a18'; x.textAlign = 'center'; x.font = 'bold 22px Arial'; x.fillText('Bitte ziehen Sie', w / 2, 76); x.fillText('eine Nummer', w / 2, 106);
    x.fillStyle = '#b3261a'; x.beginPath(); x.arc(w / 2, 200, 34, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.arc(w / 2 - 10, 190, 12, 0, 7); x.fill();
    x.fillStyle = '#141414'; x.fillRect(58, 270, w - 116, 16); x.fillStyle = '#e8e2cd'; x.fillRect(64, 272, w - 128, 6); amt_auge(x, w / 2, 350, 18, '#262824');
    for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(40,30,20,${amt_R(.05, .2)})`; x.fillRect(amt_R(8, w - 8), amt_R(8, h - 8), amt_R(1, 3), amt_R(1, 5)); } });
  amt_flaeche(amt_decal(auto, { rough: .5, metal: .4 }), nx, 1.28, nz, .26, .41, 0);
  const zettel = amt_cv(128, 64, (x, w, h) => { amt_rs = 79; amt_papier(x, w, h, { bg: '#e2dccc', flecken: 1 }); x.fillStyle = '#121212'; x.textAlign = 'center'; x.font = 'bold 44px Arial'; x.fillText('8', w / 2, 50); });
  S.nrZettel = amt_flaeche(amt_decal(zettel), nx, 1.02, nz + .03, .07, .035, 0, 0, -.35); S.nrZettel.visible = false;
  const krz = amt_cv(256, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.lineCap = 'round'; for (let i = 0; i < 3; i++) { x.strokeStyle = 'rgba(28,26,22,.55)'; x.lineWidth = 3.4; x.beginPath(); x.moveTo(60 + i * 26, 18); x.quadraticCurveTo(70 + i * 26, 64, 64 + i * 26, 112); x.stroke(); x.strokeStyle = 'rgba(210,205,190,.45)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(62 + i * 26, 20); x.quadraticCurveTo(72 + i * 26, 64, 66 + i * 26, 110); x.stroke(); } });
  amt_flaeche(amt_decal(krz), nx + .42, .72, nz + .003, .24, .12, 0);
  amt_hit(nx, 1.2, nz + .1, .32, .5, .2, () => amt_S.nr ? 'Nummernautomat' : 'Eine Nummer ziehen', () => amt_nummer());
  amt_hit(nx + .42, .72, nz + .08, .28, .18, .12, 'Kratzer', () => toast('Drei parallele Kratzer im Putz. In Kinderhöhe. Frisch.', 3000));
  // Lautsprecher-Kästen (alle Räume) und der Speicherzettel am ersten
  const lk = S.lkMat = amt_decal(amt_cv(256, 256, (x, w) => { x.fillStyle = '#4b4f4a'; x.fillRect(0, 0, w, w); x.fillStyle = '#1a1c1a'; for (let yy = 30; yy < w - 30; yy += 16) for (let xx = 30; xx < w - 30; xx += 16) { x.beginPath(); x.arc(xx, yy, 4.5, 0, 7); x.fill(); } x.strokeStyle = '#2a2d29'; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, w - 10); }), { rough: .6, metal: .3 });
  for (const [bx, by, bz, ry] of AMT_BOXEN) amt_flaeche(lk, bx, by, bz, .24, .24, ry);
  const spz = amt_cv(256, 180, (x, w, h) => { amt_rs = 81; amt_papier(x, w, h, { bg: '#e8e4d4', flecken: 2 }); x.fillStyle = '#1c2a55'; x.font = '19px Caveat'; ['Bandschleife Ansagen 2009, Sprecher H. W.', 'Nicht löschen. Läuft bei Stromausfall', 'über Batterie. Wer das Band verstellt', 'hört: das ist nicht das Band.'].forEach((t, i) => x.fillText(t, 14, 40 + i * 34)); });
  amt_flaeche(amt_decal(spz), AMT_BOXEN[0][0], 2.03, AMT_BOXEN[0][2] - .003, .2, .14, PI, .04);
  amt_hit(AMT_BOXEN[0][0], 2.1, zN - .12, .35, .4, .2, 'Zettel am Lautsprecher', () => amt_note('Speicherzettel', '<span class="hand">„Bandschleife Ansagen 2009, Sprecher H. W. Nicht löschen. Läuft bei Stromausfall über Batterie. Wer das Band verstellt hört: das ist nicht das Band.“</span>', 'speicherzettel'));
  // Kinderhandabdrücke, dichter werdend, alle in derselben Höhe (letzte Tunnelmeter).
  // Nutzer 02.10.: „selbst gezeichnet → ultra realistisch“. Vorher: Ellipsen in Flachfarbe. Jetzt: Farbe und Relief aus dem Megascans-Blutfoto (blood_hv: Farbe, Normalen,
  // Rauheit – nass glänzend, wo dick), die Form als Maske: Handballen mit Druckzonen (Mitte dünn, Ränder satt), Fingerglieder mit Lücken an den Gelenken,
  // trockene Aussparungen (Hautporen/Rillen), verwischte Ränder; manche Abdrücke rutschen ab und ziehen eine Spur, an einigen läuft ein Tropfen herab.
  const handM = (x, s, rut, tropf) => { x.save(); x.scale(s, s);
    const blob = (cx, cy, rx, ry, a, k) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); g.addColorStop(0, `rgba(255,255,255,${.55 * k})`); g.addColorStop(.62, `rgba(255,255,255,${.95 * k})`); g.addColorStop(.86, `rgba(255,255,255,${.7 * k})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.save(); x.translate(cx, cy); x.rotate(a); x.scale(1, ry / rx); x.translate(-cx, -cy); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rx, 0, 7); x.fill(); x.restore(); };
    blob(0, 2, 15, 18, 0, 1); blob(-6, 10, 8, 9, .3, .8); blob(7, 9, 7, 8, -.2, .7); // Ballen (Daumen-/Kleinfingerballen satter)
    for (const [a, l] of [[-1.05, 18], [-.45, 23], [-.1, 25], [.25, 23], [.75, 16]]) { x.save(); x.rotate(a + amt_R(-.06, .06)); for (let gl = 0; gl < 3; gl++) { const L = l / 3; blob(0, -16 - gl * (L + 1.6) - L / 2, 4.4 - gl * .35, L / 2 + .6, 0, gl === 2 ? 1 : .85); } x.restore(); }
    x.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 70; k++) { x.fillStyle = `rgba(0,0,0,${amt_R(.25, .8)})`; x.beginPath(); x.arc(amt_R(-14, 14), amt_R(-38, 18), amt_R(.4, 1.6), 0, 7); x.fill(); } // Poren, trockene Stellen
    x.lineWidth = .7; x.strokeStyle = 'rgba(0,0,0,.5)'; for (let k = 0; k < 6; k++) { x.beginPath(); const yy = amt_R(-6, 12); x.moveTo(-14, yy); x.bezierCurveTo(-4, yy + amt_R(-3, 3), 4, yy + amt_R(-3, 3), 14, yy + amt_R(-2, 2)); x.stroke(); } // Handlinien
    x.globalCompositeOperation = 'source-over';
    if (rut) { const g = x.createLinearGradient(0, 18, 0, 18 + rut); g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(-12, 14, 24, rut); } // abgerutscht: Wischspur nach unten
    if (tropf) { x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(amt_R(-6, 6), 14, 1.6, tropf); x.beginPath(); x.arc(0, 14 + tropf, 1.7, 0, 7); x.fill(); }
    x.restore(); };
  const haende = amt_cv(2048, 192, (x, w, h) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); amt_rs = 83; let px = 22; while (px < w - 22) { const dich = px / w;
    x.save(); x.translate(px, 78 + amt_R(-5, 5)); x.rotate(amt_R(-.35, .35)); const hs = amt_R(.9, 1.15) * .95;
    if (ECHT.img.handblut) { x.globalAlpha = amt_R(.7, 1); echt_hand(x, 0, -6, 62 * hs, '#fff', 1, 0, amt_R(0, 1) < .5, amt_R(0, 1) < .3 ? 'trocken' : 'blut'); } // echte Hand: Megascans „Hand Smear“ / „Hand Print“ (Maske für das Blutfoto)
    else handM(x, hs, amt_R(0, 1) < .18 ? amt_R(18, 42) : 0, amt_R(0, 1) < .22 ? amt_R(14, 60) : 0); x.restore(); px += amt_R(40, 150) * (1.15 - dich * .95); } });
  const hTex = amt_tex(haende); hTex.colorSpace = THREE.NoColorSpace;
  const bt = (f, srgb) => { const t = msTex('blood_hv/' + f, srgb).clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10.7, 1); t.needsUpdate = true; return t; };
  const hm = new THREE.MeshStandardMaterial({ map: bt('b.png', true), normalMap: bt('n.jpg', false), roughnessMap: bt('orm.jpg', false), color: 0x7a2a22, roughness: .55, metalness: 0,
    alphaMap: hTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, side: THREE.DoubleSide });
  hm.normalScale.set(.9, .9);
  amt_flaeche(hm, X0 + 13.8, .92, zN - .012, 7.6, .71, PI); const h2 = amt_flaeche(hm, X0 + 13.8, .92, zS + .012, 7.6, .71, 0); h2.scale.x = -1;
  // Tote Rauchmelder an der Decke, Kabelkanal, Wasserflecken (Leben im Beton)
  amt_rauchmelder(X0 + 3, Z0); amt_rauchmelder(X0 + 12, Z0);
}
function amt_rauchmelder(x, z) { const m = amt_S.rmMat || (amt_S.rmMat = amt_decal(amt_cv(128, 128, (c, w) => { c.clearRect(0, 0, w, w); c.fillStyle = '#d9d6cc'; c.beginPath(); c.arc(64, 64, 58, 0, 7); c.fill(); c.strokeStyle = '#a9a69c'; c.lineWidth = 3; for (let r = 20; r < 56; r += 9) { c.beginPath(); c.arc(64, 64, r, 0, 7); c.stroke(); } c.fillStyle = '#4a4a44'; c.beginPath(); c.arc(64, 64, 8, 0, 7); c.fill(); c.fillStyle = 'rgba(80,60,30,.35)'; c.beginPath(); c.arc(80, 40, 30, 0, 7); c.fill(); }), { rough: .6 }));
  amt_flaeche(m, x, C2.h - .012, z, .14, .14, 0, 0, PI / 2); }
function amt_uhrStellen() { const S = amt_S; if (!S.uhren) return; const min = S.uhrMin % 60, h = Math.floor(S.uhrMin / 60) % 12 + min / 60;
  for (const U of S.uhren) { U.min.rotation.z = -min / 60 * PI * 2 * (U.m.rotation.y === PI || U.m.rotation.y === -PI / 2 ? 1 : 1); U.std.rotation.z = -h / 12 * PI * 2; } }
// Die Uhren laufen auf 03:13 zu – sie springen an Story-Punkten (nie rückwärts; gesprochen wird keine Uhrzeit)
function amt_uhr(hh, mm, klack = true) { const S = amt_S, t = hh * 60 + mm; if (t <= S.uhrMin) return; S.uhrMin = t; amt_uhrStellen(); if (klack && S.uhren) { const P = player.pos; let b = S.uhren[0], d = 1e9; for (const U of S.uhren) { const e = Math.hypot(U.x - P.x, U.z - P.z); if (e < d) { d = e; b = U; } } if (d < 12) amt_klick(b.x, b.y, b.z); }
  try { if (typeof leben_uhr === 'function') leben_uhr(hh, mm, false); } catch (e) {} }

// ================================================================ ARCHIV: Westwand mit zwei Nebentüren, Rollwagen mit Nadeldrucker, Dienstanweisung 2, Post-it-Krieg, GRÜNDUNG, Aktenvernichter
async function amt_bauArchiv(S, K) {
  const X0 = C2.x, Z0 = C2.z, H = C2.h, B = S.build;
  B.wandWeg((o, bb) => Math.abs((bb.min.x + bb.max.x) / 2 - (X0 + 18)) < .06 && bb.max.x - bb.min.x < .35 && bb.min.z > Z0 - 6.3 && bb.max.z < Z0 + 6.3 && o.material === M.block);
  wall('z', X0 + 18, Z0 - 6, Z0 + 6, H, M.block, [{ at: Z0 - 4.6, w: 1.0 }, { at: Z0, w: 1.6 }, { at: Z0 + 4.3, w: 1.0 }], .3);
  // Rollwagen aus Stahl mit Nadeldrucker, Leporello-Stapel und Endlospapier bis auf den Boden
  const pc = amt_cv(256, 1216, () => {}); S.papierCtx = pc.getContext('2d'); S.papierTex = amt_tex(pc); amt_papierNeu();
  const pm = new THREE.MeshStandardMaterial({ map: S.papierTex, roughness: .95, side: THREE.DoubleSide });
  S.papierMat = pm; AMT_DRUCK.y = .98; S.druckerGrp = amtp_druckerWagen(pm); S.druckerGrp.position.set(AMT_DRUCK.x, 0, AMT_DRUCK.z); S.druckerGrp.rotation.y = -PI / 2; scene.add(S.druckerGrp);
  amt_boden(pm, AMT_DRUCK.x - .5, AMT_DRUCK.z + .05, .22, .46, .15, .015); amt_boden(pm, AMT_DRUCK.x - .55, AMT_DRUCK.z - .02, .22, .46, -.1, .02);
  amt_hit(AMT_DRUCK.x - .1, .98, AMT_DRUCK.z, .7, .5, .6, 'Nadeldrucker', () => amt_note('Endlospapier', '<span style="font-family:Courier New,monospace;font-size:.9em">' + (amt_S.druckZ.length ? amt_S.druckZ.join('<br>') : 'Leer. Nur die Lochränder.') + '</span>', null));
  // Dienstanweisung 2 (Nordwand)
  const da2 = amt_cv(512, 640, (x, w, h) => { amt_rs = 85; amt_papier(x, w, h, { bg: '#c8c5bb', knick: 1 }); x.fillStyle = '#1e1d1b'; x.font = 'bold 26px "Special Elite", Courier New'; x.fillText('DIENSTANWEISUNG', 40, 80); x.fillRect(40, 94, w - 80, 2);
    x.font = '28px "Special Elite", Courier New'; ['Rückläufer werden nicht', 'geduzt. Rückläufer sind', 'Köder. Köder haben keine', 'Namen, sie haben Nummern.'].forEach((t, i) => x.fillText(t, 40, 180 + i * 50));
    x.font = 'bold 20px "Special Elite", Courier New'; x.textAlign = 'center'; x.fillText('SEHEN · BERGEN · SCHWEIGEN', w / 2, h - 60); amt_auge(x, w - 50, h - 50, 18); });
  amt_flaeche(amt_decal(da2), X0 + 19.6, 1.5, Z0 + 5.845, .32, .4, PI);
  amt_hit(X0 + 19.6, 1.5, Z0 + 5.7, .4, .5, .2, 'Dienstanweisung', () => amt_note('Dienstanweisung', 'Graues Papier, Schreibmaschine:\n\n<b>„Rückläufer werden nicht geduzt. Rückläufer sind Köder. Köder haben keine Namen, sie haben Nummern.“</b>\n\n<small>SEHEN · BERGEN · SCHWEIGEN</small>', 'da_archiv',
    () => { if (!amt_S.said.pfand) { amt_S.said.pfand = 1; setTimeout(() => subtitle('Rückläufer. Wie bei Pfandflaschen.', 3000, 'LUKE'), 400); } }));
  // Post-it-Krieg an der Ordnungstafel (Hilde gegen Seiler)
  const post = amt_cv(256, 320, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#e8d86a'; x.fillRect(6, 6, w - 12, 150); x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(6, 140, w - 12, 16); x.fillStyle = '#1f2a55'; x.font = '19px Caveat';
    ['Herr Dr. Seiler, die Tafel klemmt', 'bei Platz 4. Bitte NICHT', 'mit Gewalt. H. W.'].forEach((t, i) => x.fillText(t, 16, 40 + i * 30)); x.fillStyle = '#dfd06a'; x.fillRect(22, 166, w - 30, 146); x.fillStyle = '#2a2622'; x.font = '18px Caveat';
    ['Ich habe Gewalt angewendet.', 'Sie klemmt jetzt bei Platz 5.', 'T. S.'].forEach((t, i) => x.fillText(t, 32, 200 + i * 30)); });
  amt_flaeche(amt_decal(post), X0 + 29.815, 2.08, Z0 + 3.75, .16, .2, -PI / 2, .05);
  amt_hit(X0 + 29.7, 2.08, Z0 + 3.75, .1, .26, .22, 'Zettel an der Tafel', () => amt_note('Zwei Zettel an der Tafel', '<span class="hand">„Herr Dr. Seiler, die Tafel klemmt bei Platz 4. Bitte NICHT mit Gewalt. H. W.“</span>\n\nDarunter, andere Schrift:\n<span class="hand" style="color:#333">„Ich habe Gewalt angewendet. Sie klemmt jetzt bei Platz 5. T. S.“</span>', 'postit'));
  // GRÜNDUNG: Aktendeckel oben auf dem letzten Schrank (ragt ein Stück über die Kante)
  const gd = amt_cv(256, 180, (x, w, h) => { amt_rs = 87; x.fillStyle = '#b89a6a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(60,40,20,${amt_R(.03, .12)})`; x.fillRect(amt_R(0, w), amt_R(0, h), amt_R(1, 4), amt_R(1, 4)); } x.fillStyle = '#2a1e10'; x.font = 'bold 30px "Special Elite", Courier New'; x.fillText('GRÜNDUNG', 40, 100); amt_auge(x, w - 40, 40, 16, '#3a2a18'); });
  S.gruendDeckel = amt_flaeche(new THREE.MeshStandardMaterial({ map: amt_tex(gd), roughness: .9 }), X0 + 28, 2.215, Z0 - 5.42, .34, .24, 0, .15, -PI / 2 + .06);
  { const dust = amt_decal(amt_cv(256, 160, (x, w, h) => { amt_rs = 77; x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(168,164,150,.7)'; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${amt_R(120, 200) | 0},${amt_R(116, 196) | 0},${amt_R(104, 180) | 0},${amt_R(.1, .45)})`; x.fillRect(amt_R(0, w), amt_R(0, h), amt_R(1, 4), amt_R(1, 3)); }
    x.globalCompositeOperation = 'destination-out'; x.save(); x.translate(w / 2, h / 2); x.rotate(.15); x.fillStyle = '#000'; x.fillRect(-w * .275, -h * .3, w * .55, h * .6); x.restore(); }), { rough: 1 });   // Staub auf dem Schrank; sauberes Rechteck dort, wo der Deckel lag
    amt_boden(dust, X0 + 28, Z0 - 5.42, .62, .388, .0, 2.204); }
  S.gruendHit = amt_hit(X0 + 28, 2.0, Z0 - 5.2, .8, .5, .4, () => amt_S.gruendung ? 'Archivschrank' : amt_S.leiterSteht ? 'Die Leiter hinaufsteigen' : story.items.includes('leiter_amt') ? 'Leiter aufstellen' : 'Ganz oben auf dem Schrank', () => amt_gruendung());
  S.leiterArchiv = K.kLeiter ? amt_einzel(K.kLeiter, X0 + 28, 0, Z0 - 5.05, { rx: -.28, noCol: true }) : null; if (S.leiterArchiv) S.leiterArchiv.visible = false;
  // Aktenvernichter: Bürogerät aus Teilen (amtp_vernichter), Streifen hängen heraus
  const vx = X0 + 19.05, vz = Z0 + 5.25; // Aktenvernichter (Bürogerät mit Auffangkorb) an der Südwand, Papierstreifen hängen aus dem Schlitz
  { const vg = amtp_vernichter(); vg.position.set(vx, 0, Z0 + 5.68); vg.rotation.y = PI; scene.add(vg); S.streifen = vg.userData.streifen; S.vernichterGrp = vg; }
  amt_hit(vx, .5, Z0 + 5.55, .5, .7, .45, () => amt_S.vernichter ? 'Aktenvernichter' : 'Streifen herausziehen', () => amt_vernichter());
  // Wandkalender (März 2012), Papierstapel auf den Schränken, Kabel
  const kal = amt_cv(300, 420, (x, w, h) => { amt_rs = 89; amt_papier(x, w, h, { bg: '#e4dfd0' }); x.fillStyle = '#51624a'; x.fillRect(0, 0, w, 150); x.fillStyle = '#1d1c1a'; x.font = 'bold 30px Georgia'; x.fillText('MÄRZ 2012', 60, 196); x.font = '15px Georgia'; for (let d = 1; d <= 31; d++) { const k = d + 3, px = 22 + (k % 7) * 38, py = 240 + Math.floor(k / 7) * 32; x.fillText(String(d), px, py); } });
  amt_flaeche(amt_decal(kal), X0 + 25.8, 1.62, Z0 + 5.845, .26, .36, PI);
  const stapel = amt_decal(amt_cv(256, 128, (x, w, h) => { x.clearRect(0, 0, w, h); amt_rs = 90; for (let i = 0; i < 9; i++) { x.fillStyle = ['#d9d0b8', '#cfc6ae', '#e3dcc6', '#b89a6a'][i % 4]; x.fillRect(amt_R(0, 20), h - 14 - i * 12, w - amt_R(10, 50), 11); } }));
  for (let i = 0; i < 5; i++) amt_flaeche(stapel, X0 + 20 + i * 2, 2.28, Z0 - 5.33, .7, .16, 0);
  amt_rauchmelder(X0 + 24, Z0 - 3);
}

// ================================================================ KANTINE (x 606–618, z +2…+8): Tür in der Archiv-Westwand bei z + 4,3
async function amt_bauKantine(S, K) {
  const X0 = C2.x, Z0 = C2.z, H = C2.h, B = S.build, x0 = X0 + 6, x1 = X0 + 18, z0 = Z0 + 2, z1 = Z0 + 8, zi0 = z0 + .15, zi1 = z1 - .15, xi0 = x0 + .15, xi1 = x1 - .15;
  box(.3, H, z1 - z0 + .3, x0, H / 2, (z0 + z1) / 2, M.block, { collide: true }); box(x1 - x0 + .3, H, .3, (x0 + x1) / 2, H / 2, z1, M.block, { collide: true }); box(.3, H, 2.15, x1, H / 2, z0 + 5.075, M.block, { collide: true });
  B.raum(x0, x1, z0, z1); B.innen('z', xi0 + .004, zi0, zi1, PI / 2); B.innen('x', zi1 - .004, xi0, xi1, PI); B.innen('x', zi0 + .004, xi0, xi1, 0); B.innen('z', xi1 - .004, zi0, zi1, -PI / 2, [[Z0 + 3.8, Z0 + 4.8]]);
  B.innen('z', X0 + 18.155, Z0 + 5.85, Z0 + 7.85, PI / 2); // Archivseite der neuen Wandstücke bleibt Beton (Archiv-Innenwand wie vorher)
  const L = c2Tube(X0 + 12, Z0 + 5, 1.2, 'x', 0xe2ecd8, 1.25, 8); L.mode = 'flicker';
  S.tuer.kantine = amt_tuer(K.kTuer, x1, Z0 + 4.3, 'z', 1.0, 'Kantine', { dir: -1 });
  const schild = amt_cv(512, 200, (x, w, h) => { x.fillStyle = '#ded7c2'; x.fillRect(8, 8, w - 16, h - 16); x.strokeStyle = '#27302b'; x.lineWidth = 7; x.strokeRect(16, 16, w - 32, h - 32); x.fillStyle = '#27302b'; x.textAlign = 'center'; x.font = 'bold 60px Arial'; x.fillText('KANTINE', w / 2, 92); x.font = '26px Arial'; x.fillText('Bitte Geschirr zurückbringen', w / 2, 146); });
  amt_flaeche(amt_decal(schild, { rough: .4 }), X0 + 18.157, 1.62, Z0 + 3.45, .36, .14, PI / 2);
  // Tische, Stühle (einer umgekippt), Kühlschrank (Rückfall: Stahlschrank; fehlendes Modell: Kühlschrank), Regal mit Kaffeeecke, Thermoskanne, Blechgeschirr
  const t1 = amt_put(K.kTisch, X0 + 10.2, Z0 + 5.2, { ry: .03, s: .55 }); amt_put(K.kTisch, X0 + 13.6, Z0 + 4.4, { ry: -.05, s: .55 }); const ty = K.kTisch ? amt_top(K.kTisch, t1, X0 + 10.2, Z0 + 5.2) : .76;
  for (const [x, z, r] of [[X0 + 9.5, Z0 + 4.55, .1], [X0 + 10.9, Z0 + 4.5, -.2], [X0 + 10.1, Z0 + 5.95, PI + .15], [X0 + 13.0, Z0 + 3.7, .3], [X0 + 14.3, Z0 + 5.1, PI - .1]]) amt_put(K.kStuhl, x, z, { ry: r });
  amt_put(K.kStuhl, X0 + 15.6, Z0 + 3.2, { ry: 1.2, rz: PI / 2 });
  amt_put(K.kKuehl, 0, Z0 + 7.2, { ry: PI / 2, s: .86, minX: xi0 + .02 });
  const kz = amt_cv(256, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#efe9d6'; x.save(); x.rotate(-.04); x.fillRect(16, 16, 220, 100); x.restore(); x.fillStyle = '#1f2a55'; x.font = '20px Caveat'; x.fillText('Wer meinen Joghurt nimmt, wird', 24, 48); x.fillText('rückgeführt. – N. 12', 24, 78);
    x.fillStyle = '#e9e1c8'; x.save(); x.translate(30, 132); x.rotate(.05); x.fillRect(0, 0, 210, 100); x.restore(); x.fillStyle = '#2b2b2b'; x.font = '19px Caveat'; x.fillText('Der Joghurt war von 2009.', 38, 166); x.fillText('Das war Bergung. – N. 11', 38, 196); x.fillStyle = '#c33'; x.beginPath(); x.arc(120, 20, 7, 0, 7); x.fill(); x.beginPath(); x.arc(130, 138, 7, 0, 7); x.fill(); });
  S.kzMesh = amt_flaeche(amt_decal(kz), xi0 + .66, 1.3, Z0 + 7.2, .26, .26, PI / 2);
  amt_hit(xi0 + .6, 1.3, Z0 + 7.2, .2, .35, .35, 'Zettel am Kühlschrank', () => amt_note('Zwei Zettel am Kühlschrank', '<span class="hand">„Wer meinen Joghurt nimmt, wird rückgeführt. – N. 12“</span>\n\nDarunter:\n<span class="hand">„Der Joghurt war von 2009. Das war Bergung. – N. 11“</span>', 'kuehlschrank'));
  const rg = amt_put(K.kRegal, 0, Z0 + 2.9, { ry: PI / 2, s: 1.4, minX: xi0 + .02, y: .72 }); // QA 09.10.: Wandbrett (Rückplatte −z → PI/2: an der Westwand) lag auf dem Boden (y 0, Kaffeemaschine auf 0,27 m) – jetzt Brett auf ≈ 1 m; Kaffeemaschine/Dose folgen über amt_top const ry1 = (K.kRegal ? amt_top(K.kRegal, rg, xi0 + .16, Z0 + 2.9, 1.8) : 0) || .9;
  { const km = amtp_kaffee(); km.position.set(xi0 + .21, ry1, Z0 + 2.62); km.rotation.y = PI / 2; scene.add(km); S.kaffeeGrp = km; S.kaffeeDisp = km.userData.disp;   // Filterkaffeemaschine mit Warmhalteplatte und Kanne
    const kd = amtp_dose(); kd.position.set(xi0 + .17, ry1, Z0 + 3.36); kd.rotation.y = .3; scene.add(kd); S.kassenDose = kd; }                                              // Blechdose KAFFEEKASSE
  amt_put(K.kThermos, xi0 + .17, Z0 + 2.88, { ry: .6, y: ry1 }); amt_put(K.kBlech, xi0 + .18, Z0 + 3.08, { ry: 1.1, y: ry1 }); amt_put(K.kBecher, xi0 + .15, Z0 + 3.22, { ry: 2, y: ry1 });
  amt_hit(xi0 + .3, ry1 + .15, Z0 + 2.65, .5, .4, .4, 'Kaffeeecke', () => toast('Eine Warmhalteplatte, darauf eine Kanne. Ein Filter von 2012, versteinert. Daneben eine Blechdose: KAFFEEKASSE.', 4200));
  amt_hit(xi0 + .17, ry1 + .06, Z0 + 3.36, .22, .14, .22, 'Kaffeekasse', () => amt_kaffeekasse());
  amt_put(K.kTelefon, X0 + 13.95, Z0 + 4.85, { ry: PI + .4, y: ty });
  amt_put(K.kAscher, X0 + 13.9, Z0 + 4.2, { ry: 1.3, y: ty }); amt_hit(X0 + 13.9, ty + .05, Z0 + 4.2, .25, .15, .25, 'Aschenbecher', () => amt_ascher());
  amt_put(K.kBecher, X0 + 10.5, Z0 + 5.3, { ry: .4, y: ty }); amt_put(K.kBlech, X0 + 9.7, Z0 + 5.0, { ry: 2.4, y: ty }); amt_put(K.kSack, X0 + 16.8, 0, { ry: 1, s: .8, minZ: zi0 + .05 }); amt_put(K.kEimer, X0 + 17.3, Z0 + 6.9, { ry: 2 });
  // Schwarzes Brett (Nordwand), Speiseplan (Aushang F), Wandkalender März 2012
  const brett = amt_cv(1024, 640, (x, w, h) => { amt_rs = 95; x.fillStyle = '#6a4629'; x.fillRect(0, 0, w, h); for (let i = 0; i < 7000; i++) { x.fillStyle = `rgba(${amt_R(30, 60) | 0},${amt_R(18, 36) | 0},8,${amt_R(.2, .5)})`; x.fillRect(amt_R(0, w), amt_R(0, h), amt_R(1, 3), amt_R(1, 3)); } x.strokeStyle = '#3b2a1c'; x.lineWidth = 24; x.strokeRect(0, 0, w, h);
    const zet = (px, py, ww, hh, rot, lines, fs = 22, font = '"Special Elite", Courier New', bg = '#e6e0cc', ink = '#1e1d1b') => { x.save(); x.translate(px, py); x.rotate(rot); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(5, 6, ww, hh); x.fillStyle = bg; x.fillRect(0, 0, ww, hh); x.fillStyle = ink; x.font = fs + 'px ' + font; lines.forEach((t, i) => x.fillText(t, 14, 34 + i * (fs + 8))); x.fillStyle = '#c21a12'; x.beginPath(); x.arc(ww / 2, 10, 8, 0, 7); x.fill(); x.restore(); };
    zet(40, 40, 300, 150, -.03, ['Dienstsiegel NICHT an Kinder', 'verleihen. Auch nicht', '„nur zum Gucken“.']);
    zet(360, 30, 330, 180, .02, ['Rückläufer werden nicht geduzt,', 'nicht gefüttert, nicht', '„mal kurz mit hochgenommen“.'], 19);
    zet(710, 36, 270, 330, -.01, ['Wir sind die, die nachts', 'aufbleiben, damit die', 'anderen schlafen. Jedes Kind,', 'das wir zurückholen, ist', 'eins, das es nicht behält.', 'Unruhe tötet mehr als', 'das Objekt.', 'SEHEN · BERGEN · SCHWEIGEN'], 17, 'Georgia', '#efe9d6');
    zet(60, 230, 560, 250, .025, ['Außenstelle wird geschlossen. Die Liste endet.', 'Wer 2026 noch hier ist:', 'Gott steh Lost Eyengless bei.', 'Ohne Liste nimmt sie, wen sie will.'], 25, 'Caveat', '#e9e3d0', '#2a2622');
    amt_auge(x, 180, 580, 26, 'rgba(230,220,200,.5)'); });
  amt_flaeche(amt_decal(brett, { rough: .95 }), X0 + 12.2, 1.5, zi1 - .012, 1.6, 1.0, PI);
  amt_hit(X0 + 12.2, 1.5, zi1 - .1, 1.7, 1.1, .2, 'Schwarzes Brett', () => amt_brett());
  const aus = amt_cv(512, 700, (x, w, h) => { amt_rs = 97; amt_papier(x, w, h, { bg: '#e6e1cf', kaffee: 1 }); x.fillStyle = '#1e1d1b'; x.font = 'bold 30px "Special Elite", Courier New'; x.fillText('Speiseplan Woche 31', 40, 90); x.font = '24px "Special Elite", Courier New';
    ['Mo  Kassler', 'Di  Fisch', 'Mi  Eintopf', 'Do  Sprechstunde', '    (kalte Küche)', 'Fr  —', '', 'Lucid Mint an der Kasse.', 'Bitte Becher zurückbringen.', 'Wer nach 03:00 noch im Haus', 'ist, meldet sich bei der', 'Nachsorge.'].forEach((t, i) => x.fillText(t, 40, 160 + i * 40)); amt_auge(x, w - 50, h - 50, 20); });
  amt_flaeche(amt_decal(aus), X0 + 8.4, 1.55, zi1 - .012, .3, .41, PI);
  amt_hit(X0 + 8.4, 1.55, zi1 - .1, .35, .45, .2, 'Speiseplan', () => amt_note('Speiseplan', 'Speiseplan Woche 31: Mo Kassler, Di Fisch, Mi Eintopf, Do Sprechstunde (kalte Küche), Fr —.\n\nLucid Mint an der Kasse. Bitte Becher zurückbringen. Wer nach 03:00 noch im Haus ist, meldet sich bei der Nachsorge.', 'speiseplan'));
  const kal = amt_cv(300, 420, (x, w, h) => { amt_rs = 99; amt_papier(x, w, h, { bg: '#e8e3d3' }); x.fillStyle = '#6b5a3a'; x.fillRect(0, 0, w, 150); x.fillStyle = '#1d1c1a'; x.font = 'bold 30px Georgia'; x.fillText('MÄRZ 2012', 60, 196); x.font = '15px Georgia'; for (let d = 1; d <= 31; d++) { const k = d + 3; x.fillText(String(d), 22 + (k % 7) * 38, 240 + Math.floor(k / 7) * 32); }
    x.strokeStyle = '#b01810'; x.lineWidth = 2.5; x.beginPath(); x.ellipse(22 + (34 % 7) * 38 + 8, 240 + Math.floor(34 / 7) * 32 - 6, 16, 14, 0, 0, 7); x.stroke(); x.fillStyle = '#9a1a12'; x.font = '19px Caveat'; x.fillText('Umzug Kühlung → Villa S.', 30, 404); });
  amt_flaeche(amt_decal(kal), X0 + 16.2, 1.6, zi1 - .012, .26, .36, PI);
  amt_hit(X0 + 16.2, 1.6, zi1 - .1, .3, .4, .2, 'Wandkalender', () => amt_note('Wandkalender', 'März 2012. Weiter wurde nicht geblättert. Der letzte Tag ist eingekreist:\n\n<span class="hand">„Umzug Kühlung → Villa S.“</span>', 'kalender2012'));
  if (typeof sammeln_platz === 'function') try { sammeln_platz('Z-05', { x: X0 + 13.3, y: ty + .05, z: Z0 + 4.55, ab: 2, label: 'Zeitung mit Kaffeerand' }); } catch (e) { console.warn('amt Z-05', e); }
  // Schublade unter dem Tisch: Erkundung wird belohnt (Batterie, Glänzendes)
  { const kb = await amt_kit('w_besteck', 'model.glb', .2, 'max'); amt_put(kb, X0 + 10.42, Z0 + 4.88, { y: ty + .004, ry: .5, rx: -PI / 2 }); // QA 09.10.: Modell steht (0,46 m hoch) – Besteck liegt flach   // Besteck, Serviette mit Lippenstift, Batterie mit Gummi am Löffel
    amt_boden(amt_decal(amt_cv(128, 128, (x, w) => { x.clearRect(0, 0, w, w); x.save(); x.translate(64, 64); x.rotate(.2); x.fillStyle = '#ece8dc'; x.fillRect(-52, -52, 104, 104); x.strokeStyle = 'rgba(0,0,0,.12)'; x.strokeRect(-52, -52, 104, 104); x.beginPath(); x.moveTo(-52, 0); x.lineTo(52, 0); x.moveTo(0, -52); x.lineTo(0, 52); x.stroke();
      x.fillStyle = 'rgba(165,28,44,.7)'; x.beginPath(); x.moveTo(-24, 30); x.quadraticCurveTo(-8, 14, 0, 22); x.quadraticCurveTo(8, 14, 24, 30); x.quadraticCurveTo(8, 46, 0, 40); x.quadraticCurveTo(-8, 46, -24, 30); x.fill(); x.restore(); })), X0 + 10.18, Z0 + 4.62, .2, .2, .3, ty + .002);
    S.kschubBatt = K.kBatt ? amt_einzel(K.kBatt, X0 + 10.5, ty + .017, Z0 + 4.8, { ry: .5, rz: PI / 2, noCol: true }) : null; }
  amt_hit(X0 + 10.35, ty + .03, Z0 + 4.8, .45, .1, .35, () => amt_S.said.kschub ? 'Besteck' : 'Besteck durchsuchen', () => { if (amt_S.said.kschub) return toast('Besteck, eine Serviette mit Lippenstift, sonst nichts.', 2600); amt_S.said.kschub = 1; if (S.kschubBatt) S.kschubBatt.visible = false; addBattery(1); try { if (typeof tausch_gib === 'function') tausch_gib('uhrdeckel'); } catch (e) {} toast('Besteck. Eine Batterie, mit einem Gummi an einen Löffel gebunden. Und der Deckel einer Taschenuhr.', 5200); });
  const ring = amt_decal(amt_cv(64, 64, (x, w) => { x.clearRect(0, 0, w, w); x.strokeStyle = 'rgba(70,45,20,.45)'; x.lineWidth = 5; x.beginPath(); x.arc(32, 32, 24, .3, 5.9); x.stroke(); }));
  for (let i = 0; i < 5; i++) amt_boden(ring, X0 + 9.4 + i * .9, Z0 + 4.9 + (i % 2) * .5, .12, .12, i, ty + .003);
  amt_rauchmelder(X0 + 12, Z0 + 6.2); AMT_BOXEN.push([X0 + 15.2, 2.3, Z0 + 7.84, PI]); amt_flaeche(S.lkMat, X0 + 15.2, 2.3, Z0 + 7.84, .24, .24, PI);
}

// ================================================================ HÄNGEREGISTRATUR (x 606–618, z −8…−2): Tür bei z − 4,6 mit Zahlenschloss
async function amt_bauRegistratur(S, K) {
  const X0 = C2.x, Z0 = C2.z, H = C2.h, B = S.build, x0 = X0 + 6, x1 = X0 + 18, z0 = Z0 - 8, z1 = Z0 - 2, zi0 = z0 + .15, zi1 = z1 - .15, xi0 = x0 + .15, xi1 = x1 - .15;
  box(.3, H, z1 - z0 + .3, x0, H / 2, (z0 + z1) / 2, M.block, { collide: true }); box(x1 - x0 + .3, H, .3, (x0 + x1) / 2, H / 2, z0, M.block, { collide: true }); box(.3, H, 2.15, x1, H / 2, z0 + .925, M.block, { collide: true });
  B.raum(x0, x1, z0, z1); B.innen('z', xi0 + .004, zi0, zi1, PI / 2); B.innen('x', zi0 + .004, xi0, xi1, 0); B.innen('x', zi1 - .004, xi0, xi1, PI); B.innen('z', xi1 - .004, zi0, zi1, -PI / 2, [[Z0 - 5.1, Z0 - 4.1]]);
  S.regTube = c2Tube(X0 + 12, Z0 - 5, 1.2, 'x', 0xe6ecff, 1.05, 8);
  S.tuer.reg = amt_tuer(K.kTuer, x1, Z0 - 4.6, 'z', 1.0, 'Hängeregistratur (Zahlenschloss)', { locked: true, zu: () => amt_zahlenschloss(), dir: 1 });
  const schild = amt_cv(512, 200, (x, w, h) => { x.fillStyle = '#ded7c2'; x.fillRect(8, 8, w - 16, h - 16); x.strokeStyle = '#27302b'; x.lineWidth = 7; x.strokeRect(16, 16, w - 32, h - 32); x.fillStyle = '#27302b'; x.textAlign = 'center'; x.font = 'bold 48px Arial'; x.fillText('HÄNGEREGISTRATUR', w / 2, 92); x.font = '34px Arial'; x.fillText('Zyklen', w / 2, 150); });
  amt_flaeche(amt_decal(schild, { rough: .4 }), X0 + 18.157, 1.62, Z0 - 3.55, .36, .14, PI / 2);
  const kreide = amt_cv(512, 200, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(232,228,214,.85)'; x.font = '64px Caveat'; x.fillText('Alle siebzehn.', 40, 120); x.strokeStyle = 'rgba(232,228,214,.6)'; x.lineWidth = 3; x.beginPath(); x.moveTo(40, 140); x.lineTo(380, 136); x.stroke(); });
  amt_flaeche(amt_decal(kreide), X0 + 18.158, .92, Z0 - 3.55, .42, .16, PI / 2);
  const schloss = amt_cv(256, 256, (x, w) => { const g = x.createLinearGradient(0, 0, w, w); g.addColorStop(0, '#6c6456'); g.addColorStop(1, '#3a342a'); x.fillStyle = g; x.fillRect(20, 20, w - 40, w - 40); for (let i = 0; i < 4; i++) { x.fillStyle = '#16140f'; x.fillRect(38 + i * 46, 90, 36, 76); x.fillStyle = '#d8d0b8'; x.font = 'bold 30px Courier New'; x.fillText('0', 46 + i * 46, 138); } });
  amt_flaeche(amt_decal(schloss, { rough: .4, metal: .6 }), X0 + 18.158, 1.12, Z0 - 3.98, .1, .1, PI / 2);
  // Einrichtung: Registraturschränke (Stahl), Hängemappen (Aufkleber), Tisch
  [X0 + 7.3, X0 + 9.3, X0 + 11.3, X0 + 13.3].forEach((x, i) => K.amt_schrankPlatz(x, 0, { ry: 0, minZ: zi0 + .02 }, i));      // Hängeregistraturschränke (je Platz zwei, 0,47 m)
  [X0 + 7.6, X0 + 9.6, X0 + 14.6].forEach((x, i) => K.amt_schrankPlatz(x, 0, { ry: PI, maxZ: zi1 - .02 }, i + 1));
  const rt = amt_put(K.kTisch, X0 + 12.4, Z0 - 5.0, { ry: 0, s: .55 }); const rty = K.kTisch ? amt_top(K.kTisch, rt, X0 + 12.4, Z0 - 5.0) : .76; S.regTischY = rty;
  amt_put(K.kStuhl, X0 + 12.1, Z0 - 5.85, { ry: .2 }); amt_put(K.kSack, X0 + 16.6, 0, { ry: 2, s: .8, minZ: zi0 + .05 }); amt_put(K.kRoehre, X0 + 13.1, Z0 - 4.8, { ry: 2.8, y: rty });
  const mappen = amt_decal(amt_cv(1024, 256, (x, w, h) => { amt_rs = 101; x.clearRect(0, 0, w, h); for (let i = 0; i < 40; i++) { const px = i * 25 + amt_R(-3, 3); x.fillStyle = ['#8a7a58', '#6e7a5c', '#9b8a62', '#7a6a50'][i % 4]; x.fillRect(px, 30 + amt_R(0, 10), 22, h - 40); x.fillStyle = '#e8e2cc'; x.fillRect(px + 2, 20, 18, 22); x.fillStyle = '#222'; x.font = '10px Courier New'; x.fillText(['58', '75', '92', '09'][i % 4], px + 4, 36); } }));
  S.regFotoMesh = []; for (let i = 0; i < 4; i++) { const m = amt_boden(new THREE.MeshStandardMaterial({ map: amt_tex(amt_regFoto(i, false)), roughness: .45 }), X0 + 11.75 + i * .42, Z0 - 5.0, .3, .2, amt_R(-.08, .08), rty + .0135); m.visible = false; S.regFotoMesh.push(m);
    const mg = amtp_mappe(['#8a7a58', '#6e7a5c', '#9b8a62', '#7a6a50'][i], ['1958', '1975', '1992', '2009'][i]); mg.position.set(X0 + 11.75 + i * .42, rty + .001, Z0 - 5.0 + (i % 2 ? .02 : -.015)); mg.rotation.y = [-.06, .05, -.03, .08][i]; scene.add(mg); }  // die vier Hängemappen liegen fest auf dem Tisch
  S.regBack = new THREE.MeshStandardMaterial({ map: amt_tex(amt_regFoto(0, true)), roughness: .8 });
  S.regMappen = amt_hit(X0 + 12.4, rty + .1, Z0 - 5.0, 1.8, .3, .8, 'Vier Hängemappen', () => amt_regMappen());
  amt_hit(X0 + 7.3, 1.2, zi0 + .68, .9, .5, .3, () => amt_S.said.regschub ? 'Registraturschrank' : 'Registraturschrank durchsuchen', () => { if (amt_S.said.regschub) return toast('Leere Reiter, 1958 bis 2009. Nichts für 2026. Noch nicht.', 3000); amt_S.said.regschub = 1; addBattery(1); toast('Hinter den Hängemappen, mit Klebeband: eine Batterie. „Notreserve“, in Druckschrift.', 4200); });
  amt_rauchmelder(X0 + 12, Z0 - 3.5);
}
// Die vier Sommerfest-Fotos (Hängeregistratur): alt, unscharf, gekörnt – Kinder mit Lampions, am Rand das blasse Mädchen, am anderen Rand der Mann im grauen Mantel
function amt_regFoto(i, hinten) { const J = [1958, 1975, 1992, 2009][i];
  return amt_cv(900, 600, (x, W_, H_) => { x.scale(1.5, 1.5); const w = 600, h = 400; amt_rs = 200 + i * 17; if (hinten) { amt_papier(x, w, h, { bg: '#e6e0cc' }); x.fillStyle = '#2a2622'; x.font = '30px Caveat'; x.fillText(['Rieke, Hans, 6 – Verbleib.', 'Hofer, A., 9 – Verbleib.', 'Pfarrer entfernt. Bericht (hw).', 'Belegfoto. B anwesend.'][i], 40, 90); return; }
    const sepia = i === 0 ? [118, 112, 104] : i === 1 ? [168, 120, 70] : i === 2 ? [120, 110, 95] : [110, 118, 104]; x.fillStyle = `rgb(${sepia})`; x.fillRect(0, 0, w, h);
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, i === 0 ? 'rgba(40,40,40,.55)' : 'rgba(20,24,40,.5)'); g.addColorStop(.6, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.35)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.filter = 'blur(2px)';
    if (i === 0) { x.fillStyle = '#4a4640'; x.beginPath(); x.moveTo(250, 250); x.lineTo(250, 120); x.lineTo(300, 70); x.lineTo(350, 120); x.lineTo(350, 250); x.fill(); } // Kapelle
    if (i === 2) { x.fillStyle = '#6e6454'; x.fillRect(120, 110, 360, 150); x.fillStyle = '#8a7c66'; x.beginPath(); x.moveTo(110, 110); x.lineTo(300, 50); x.lineTo(490, 110); x.fill(); } // Schützenzelt
    const mann = (hx, hy, hand) => { x.fillStyle = 'rgba(70,72,74,.95)'; x.fillRect(hx - 20, hy + 30, 40, 150); x.beginPath(); x.arc(hx, hy + 16, 14, 0, 7); x.fill(); x.fillStyle = 'rgba(40,40,42,.95)'; x.fillRect(hx - 20, hy, 40, 8); x.fillRect(hx - 12, hy - 14, 24, 16);
      if (hand) { x.strokeStyle = 'rgba(70,72,74,.95)'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(hx + 14, hy + 50); x.lineTo(hx + 34, hy + 96); x.lineTo(hx + 12, hy + 128); x.stroke(); x.fillStyle = 'rgba(12,10,10,.97)'; x.beginPath(); x.ellipse(hx + 12, hy + 130, 9, 7, .4, 0, 7); x.fill(); } }; // Hand (Lederhandschuh) liegt auf der Schulter
    const hx = i === 3 ? 302 : i === 0 ? 20 : 545, hy = i === 3 ? 150 : 150;
    if (i === 3) mann(hx, hy - 36, true);  // 2009: direkt hinter den Kindern, eine Hand auf Zayns Schulter
    const kinder = 7, y0 = 300; for (let k = 0; k < kinder; k++) { const px = 150 + k * 50 + amt_R(-6, 6), s = (i === 0 && k === 4 ? .72 : amt_R(.85, 1.05)); x.fillStyle = `rgba(${40 + k * 5},${35 + k * 4},${30 + k * 3},.95)`; x.beginPath(); x.arc(px, y0 - 70 * s, 12 * s, 0, 7); x.fill(); x.fillRect(px - 13 * s, y0 - 58 * s, 26 * s, 58 * s);
      const lg = x.createRadialGradient(px + 16, y0 - 100 * s, 1, px + 16, y0 - 100 * s, 18); lg.addColorStop(0, i === 0 ? 'rgba(250,250,240,.95)' : 'rgba(255,220,140,.95)'); lg.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = lg; x.beginPath(); x.arc(px + 16, y0 - 100 * s, 18, 0, 7); x.fill(); x.strokeStyle = 'rgba(30,30,30,.6)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(px + 6, y0 - 60 * s); x.lineTo(px + 16, y0 - 90 * s); x.stroke();
      if (i === 1 && k === 1) { x.fillStyle = 'rgba(205,70,56,.95)'; x.fillRect(px - 13 * s, y0 - 76 * s, 26 * s, 6); }                                 // Junge mit Stirnband
      if (i === 1 && k === 3) { x.strokeStyle = 'rgba(80,52,30,.97)'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(px - 11 * s, y0 - 64 * s); x.quadraticCurveTo(px - 17 * s, y0 - 46 * s, px - 12 * s, y0 - 30 * s); x.moveTo(px + 11 * s, y0 - 64 * s); x.quadraticCurveTo(px + 17 * s, y0 - 46 * s, px + 12 * s, y0 - 30 * s); x.stroke();   // Zöpfe
        x.strokeStyle = 'rgba(60,90,40,.95)'; x.lineWidth = 2; x.beginPath(); x.moveTo(px - 18 * s, y0 - 38 * s); x.lineTo(px - 22 * s, y0 - 14 * s); x.stroke(); x.fillStyle = 'rgba(250,214,50,.98)'; x.beginPath(); x.arc(px - 18 * s, y0 - 40 * s, 6, 0, 7); x.fill(); } // Butterblume in der Hand
      if ((i === 1 && k === 5) || (i === 3 && k === 5)) { x.fillStyle = `rgba(${40 + k * 5},${35 + k * 4},${30 + k * 3},.95)`; x.beginPath(); x.moveTo(px + 10 * s, y0 - 76 * s); x.lineTo(px + 21 * s, y0 - 68 * s); x.lineTo(px + 10 * s, y0 - 62 * s); x.fill(); } } // Nase im Profil: guckt nach rechts (1975: falsche Richtung; 2009: Lucy sieht das Mädchen an)
    if (i === 0) { x.strokeStyle = 'rgba(25,25,25,.92)'; x.lineWidth = 3.4; x.lineCap = 'round'; const bx = 404, by = y0 - 34; x.beginPath(); x.arc(bx, by, 34, 0, 7); x.stroke(); x.beginPath(); x.arc(bx + 70, by, 34, 0, 7); x.stroke(); x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + 24, by - 40); x.lineTo(bx + 70, by); x.moveTo(bx + 24, by - 40); x.lineTo(bx + 62, by - 44); x.lineTo(bx + 70, by); x.moveTo(bx + 62, by - 44); x.lineTo(bx + 60, by - 66); x.moveTo(bx + 50, by - 66); x.lineTo(bx + 72, by - 66); x.stroke(); } // 1958: Kinderfahrrad, zu groß für den kleinen Jungen (Lenker über seinem Kopf)
    if (i === 2) { x.fillStyle = 'rgba(20,20,20,.9)'; x.fillRect(290, 200, 26, 100); x.beginPath(); x.arc(303, 188, 14, 0, 7); x.fill(); x.filter = 'none'; x.strokeStyle = '#1b2656'; x.lineWidth = 4; x.beginPath(); x.moveTo(270, 170); x.lineTo(340, 300); x.moveTo(340, 170); x.lineTo(270, 300); x.stroke(); x.filter = 'blur(2px)'; }
    // das Mädchen im weißen Sommerkleid, barfuß, immer gleich alt – am Rand
    const mx = (i === 3 || i === 0) ? 545 : 70; x.fillStyle = 'rgba(236,236,230,.92)'; x.beginPath(); x.arc(mx, 222, 11, 0, 7); x.fill(); x.beginPath(); x.moveTo(mx - 10, 236); x.lineTo(mx + 10, 236); x.lineTo(mx + 18, 300); x.lineTo(mx - 18, 300); x.fill();
    // der Mann im grauen Mantel mit Hut – anderer Rand (1958: ganz links, halb hinter dem Fotografen)
    if (i !== 3) mann(hx, hy, false);
    if (i === 2) { x.fillStyle = 'rgba(150,150,150,.9)'; x.fillRect(hx + 18, hy + 90, 10, 30); } // Thermoskanne
    if (i === 0) { x.fillStyle = 'rgba(20,20,20,.55)'; x.beginPath(); x.moveTo(0, 120); x.quadraticCurveTo(46, 150, 52, 400); x.lineTo(0, 400); x.fill(); } // der Fotograf: unscharfer Schatten am linken Bildrand
    x.filter = 'none';
    for (let k = 0; k < 14000; k++) { const v = amt_R(0, 255) | 0; x.fillStyle = `rgba(${v},${v},${v},.06)`; x.fillRect(amt_R(0, w), amt_R(0, h), 1.1, 1.1); } // Korn
    x.strokeStyle = i === 0 ? '#e9e5da' : '#efeae0'; x.lineWidth = i === 0 ? 16 : 18; x.strokeRect(0, 0, w, h);
    if (i === 0) { x.fillStyle = '#e9e5da'; for (let k = 0; k < w; k += 16) { x.beginPath(); x.arc(k, 0, 8, 0, PI); x.fill(); x.beginPath(); x.arc(k, h, 8, PI, 7); x.fill(); } } // Zackenrand
    if (i === 1 || i === 3) { x.save(); x.translate(w - 170, h - 60); x.rotate(-.12); x.strokeStyle = 'rgba(160,20,20,.7)'; x.lineWidth = 3; x.strokeRect(-10, -26, 180, 40); x.fillStyle = 'rgba(160,20,20,.7)'; x.font = 'bold 14px Arial'; x.fillText('ERSCHEINUNGSFORM B', 0, -2); x.restore(); }
    x.fillStyle = 'rgba(40,30,20,.7)'; x.font = '16px Georgia'; x.fillText(String(J), 20, h - 18); }); }

// ================================================================ SICHERUNGSRAUM: Funkgerät (AG-06), Batterien im Dreieck, DA 4, Leiter, Kühlregal (Nische), Aufkleber, Tür zum Planungsraum
async function amt_bauSicherung(S, K) {
  const X0 = C2.x, Z0 = C2.z, H = C2.h, B = S.build;
  // Nordwand mit Tür (x + 31) neu; Planungsraum dahinter
  B.wandWeg((o, bb) => o.material === M.block && Math.abs((bb.min.z + bb.max.z) / 2 - (Z0 + 8)) < .06 && bb.max.z - bb.min.z < .35 && bb.min.x > X0 + 29.6 && bb.max.x < X0 + 36.4);
  wall('x', Z0 + 8, X0 + 30, X0 + 36, H, M.block, [{ at: X0 + 31, w: 1.0 }], .3);
  // Funkgerät auf der Werkbank (zwischen den Monitoren), grünes Lämpchen
  S.funkPos = { x: X0 + 30.5, y: .95, z: Z0 + 4.9 };
  const bankY = typeof innen_kapitel_S !== 'undefined' && innen_kapitel_S.sichBankY ? innen_kapitel_S.sichBankY : .8;
  S.funkPos.y = bankY; amt_put(K.kFunk, X0 + 30.52, Z0 + 4.92, { ry: PI / 2 + .12, y: bankY });
  S.funkLed = amt_flaeche(new THREE.MeshBasicMaterial({ map: amt_tex(amt_cv(32, 32, (x, w) => { const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, '#dfffe0'); g.addColorStop(.3, 'rgba(80,255,110,.9)'); g.addColorStop(1, 'rgba(0,120,30,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); })), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), X0 + 30.62, bankY + .09, Z0 + 4.78, .05, .05, PI / 2);
  amt_hit(X0 + 30.55, bankY + .08, Z0 + 4.92, .3, .2, .4, 'Funkgerät', () => { if (!ch2.ag06) return amt_ag06(); toast('Das Funkgerät. Das grüne Lämpchen brennt. Die Batterie ist frisch gewechselt. Hier unten war jemand. Heute.', 4200); });
  // Drei Batterien im Dreieck (Hauptweg: knapp, aber fair)
  S.battObj = []; for (const [dx, dz] of [[0, 0], [.07, .06], [-.07, .06]]) { const g = amt_einzel(K.kBatt, X0 + 30.55 + dx, bankY, Z0 + 5.95 + dz, { ry: amt_R(0, 3), rz: PI / 2, noCol: true }); if (g) S.battObj.push(g); }
  S.battHit = amt_hit(X0 + 30.55, bankY + .05, Z0 + 5.98, .3, .15, .3, 'Drei Batterien', () => amt_batterien());
  // Dienstanweisung 4 (graues Papier) mit Seilers Handschrift, neben der Kreide
  const da4 = amt_cv(420, 600, (x, w, h) => { amt_rs = 111; amt_papier(x, w, h, { bg: '#c3c1b9', knick: 1 }); x.fillStyle = '#1e1d1b'; x.font = 'bold 22px "Special Elite", Courier New'; x.fillText('DIENSTANWEISUNG 4 (1992)', 26, 60); x.fillRect(26, 70, w - 52, 2); x.font = '19px "Special Elite", Courier New';
    ['Rückläufer (R-Fälle) sind zu', 'beobachten, nicht aufzuklären.', 'Eine aufgeklärte Person gilt', 'als offen. Offene Personen sind', 'unter die Erde zu verbringen', '(Aus-Regel, vgl. Kinderspiel).', 'Zuwiderhandlung: Versetzung.'].forEach((t, i) => x.fillText(t, 26, 120 + i * 32));
    x.fillStyle = '#2a2a6a'; x.font = '34px Caveat'; x.fillText('Kranz. Zu spät.', 60, 400); x.fillStyle = '#1e1d1b'; x.font = 'bold 15px "Special Elite", Courier New'; x.textAlign = 'center'; x.fillText('SEHEN · BERGEN · SCHWEIGEN', w / 2, h - 40); });
  amt_flaeche(amt_decal(da4), X0 + 35.5, 1.5, Z0 + 7.845, .21, .3, PI);
  amt_hit(X0 + 35.5, 1.5, Z0 + 7.7, .3, .4, .2, 'Dienstanweisung 4', () => amt_note('Dienstanweisung 4 (1992)', 'Graues Papier:\n\n„Rückläufer (R-Fälle) sind zu beobachten, nicht aufzuklären. Eine aufgeklärte Person gilt als offen. Offene Personen sind unter die Erde zu verbringen (Aus-Regel, vgl. Kinderspiel). Zuwiderhandlung: Versetzung.“\n\nDarunter, Seilers Handschrift:\n<span class="hand">„Kranz. Zu spät.“</span>\n\n<small>SEHEN · BERGEN · SCHWEIGEN</small>', 'da4'));
  // Aufkleber am Kasten: „Bei Stromausfall bitte Ruhe bewahren …“
  const auf = amt_cv(512, 128, (x, w, h) => { x.fillStyle = '#e9d34a'; x.fillRect(4, 4, w - 8, h - 8); x.strokeStyle = '#1b1b1b'; x.lineWidth = 4; x.strokeRect(10, 10, w - 20, h - 20); x.fillStyle = '#1b1b1b'; x.font = 'bold 20px Arial'; x.fillText('Bei Stromausfall bitte Ruhe bewahren und den', 22, 54); x.fillText('zuständigen Sachbearbeiter informieren.', 22, 86); });
  amt_flaeche(amt_decal(auf, { rough: .5 }), X0 + 33, 2.2, Z0 + 7.84, .5, .125, PI);
  amt_hit(X0 + 33, 2.2, Z0 + 7.7, .55, .18, .15, 'Aufkleber', () => { toast('„Bei Stromausfall bitte Ruhe bewahren und den zuständigen Sachbearbeiter informieren.“', 4200); if (!amt_S.said.sach) { amt_S.said.sach = 1; setTimeout(() => say([['Der ist seit Jahren in Rente. Ich informiere ihn trotzdem. Herr Sachbearbeiter, es ist dunkel.', 4800, 'LUKE']]), 1200); } });
  // Leiter (mitnehmbar) an der Ostwand
  S.leiterSich = K.kLeiter ? amt_einzel(K.kLeiter, X0 + 35.55, 0, Z0 + 6.7, { ry: -PI / 2, rx: -.18, noCol: true }) : null;
  S.leiterHit = amt_hit(X0 + 35.5, 1.1, Z0 + 6.7, .4, 2.0, .6, () => amt_S.leiter ? '' : 'Leiter nehmen', () => amt_leiterNehmen());
  // Kühlregal (Nische an der Ostwand): Stahlschrank mit Glastür (Rückfall), Schild, Magnetschloss erst nach dem Notstrom
  { const kg = amtp_kuehl(); kg.position.set(X0 + 35.84 - .31, 0, Z0 + 3.55); kg.rotation.y = -PI / 2; scene.add(kg); S.kuehlGrp = kg;   // Laborkühlschrank in einer Wandnische (Pilaster und Sturz aus Putz)
    for (const dz of [-.49, .49]) box(.7, H, .12, X0 + 35.49, H / 2, Z0 + 3.55 + dz, B.putz, { collide: true }); box(.7, .3, 1.1, X0 + 35.49, 2.35, Z0 + 3.55, B.putz, { collide: true }); }
  const glas = amt_cv(256, 512, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(150,170,175,.22)'; x.fillRect(10, 10, w - 20, h - 20); x.strokeStyle = 'rgba(230,240,240,.35)'; x.lineWidth = 3; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(20, 60 + i * 120); x.lineTo(w - 20, 60 + i * 120); x.stroke(); }
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(.4, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(10, 10, w - 20, h - 20); });
  S.kuehlGlas = amt_flaeche(new THREE.MeshStandardMaterial({ map: amt_tex(glas), transparent: true, depthWrite: false, roughness: .08, metalness: .1, envMapIntensity: 1.4 }), X0 + 35.208, 1.05, Z0 + 3.55, .66, 1.58, -PI / 2);
  S.kuehlBeschlag = amt_flaeche(amt_decal(amt_cv(256, 512, (x, w, h) => { x.clearRect(0, 0, w, h); const g = x.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, h * .6); g.addColorStop(0, 'rgba(235,240,240,.75)'); g.addColorStop(1, 'rgba(235,240,240,.35)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; for (const [px, py] of [[118, 220], [98, 256], [140, 256]]) { x.beginPath(); x.arc(px, py, 10, 0, 7); x.fill(); } }), { rough: .3 }), X0 + 35.2, 1.05, Z0 + 3.55, .66, 1.58, -PI / 2);
  S.kuehlBeschlag.material.opacity = 0;
  const ks = amt_cv(512, 180, (x, w, h) => { x.fillStyle = '#d9d3bf'; x.fillRect(6, 6, w - 12, h - 12); x.fillStyle = '#b3261a'; x.fillRect(6, 6, w - 12, 36); x.fillStyle = '#fff'; x.font = 'bold 26px Arial'; x.fillText('KÜHLUNG', 20, 34); x.fillStyle = '#1b1b1b'; x.font = '24px Arial'; x.fillText('Substanz S', 20, 84); x.fillText('Zutritt nur mit Freigabe', 20, 124); amt_auge(x, w - 50, 120, 22); });
  amt_flaeche(amt_decal(ks, { rough: .4 }), X0 + 35.138, 2.35, Z0 + 3.55, .42, .15, -PI / 2);
  amt_hit(X0 + 35.3, 1.1, Z0 + 3.55, .5, 1.6, 1.0, () => amt_S.kuehl ? 'Kühlregal' : 'Kühlregal öffnen', () => amt_kuehlregal());
  amt_put(K.kSack, X0 + 31.9, 0, { ry: 1.4, s: .8, maxZ: Z0 + 7.8 }); amt_rauchmelder(X0 + 33, Z0 + 5);
  // Planungsraum (x 630–638, z +8…+14): Wände, Boden, Decke, Röhre (erst mit Notstrom), Tür
  const x0 = X0 + 30, x1 = X0 + 38, z0 = Z0 + 8, z1 = Z0 + 14;
  box(.3, H, z1 - z0 + .3, x0, H / 2, (z0 + z1) / 2, M.block, { collide: true }); box(.3, H, z1 - z0 + .3, x1, H / 2, (z0 + z1) / 2, M.block, { collide: true }); box(x1 - x0 + .3, H, .3, (x0 + x1) / 2, H / 2, z1, M.block, { collide: true });
  box(2.15, H, .3, X0 + 37, H / 2, z0, M.block, { collide: true });
  B.raum(x0, x1, z0, z1); B.innen('z', x0 + .154, z0 + .15, z1 - .15, PI / 2); B.innen('z', x1 - .154, z0 + .15, z1 - .15, -PI / 2); B.innen('x', z1 - .154, x0 + .15, x1 - .15, PI); B.innen('x', z0 + .154, x0 + .15, x1 - .15, 0, [[X0 + 30.5, X0 + 31.5]]);
  S.planTube = c2Tube(X0 + 34, Z0 + 11, 1.2, 'x', 0xffe2b4, 1.15, 8); S.planTube.mode = 'off';
  S.tuer.plan = amt_tuer(K.kTuer, X0 + 31, Z0 + 8, 'x', 1.0, 'Planung', { dir: -1 });
  const ps = amt_cv(512, 200, (x, w, h) => { x.fillStyle = '#ded7c2'; x.fillRect(8, 8, w - 16, h - 16); x.strokeStyle = '#27302b'; x.lineWidth = 7; x.strokeRect(16, 16, w - 32, h - 32); x.fillStyle = '#27302b'; x.textAlign = 'center'; x.font = 'bold 60px Arial'; x.fillText('PLANUNG', w / 2, 96); x.font = '34px Arial'; x.fillText('Zyklus 42', w / 2, 150); });
  amt_flaeche(amt_decal(ps, { rough: .4 }), X0 + 31.9, 1.62, Z0 + 7.84, .34, .13, PI);
}

// ================================================================ PLANUNGSRAUM: das Modelldorf 1 : 87 (Scans in Modellbahngröße), Figuren als bemalte Pappfiguren
async function amt_bauPlanung(S, K) {
  const X0 = C2.x, Z0 = C2.z, cx = X0 + 34, cz = Z0 + 11.2;
  const tm = amt_put(K.kTisch, cx, cz, { ry: 0, s: .8, sv: new THREE.Vector3(1, 1.25, 1.9) }); const ty = K.kTisch ? amt_top(K.kTisch, tm, cx, cz) : .76; S.modellY = ty;
  // Grundplatte: gemalte Straßen, Kreuzung, Kirchweg, Senke mit Pappkuppel „OBJEKT“; am vorderen Rand ein Schnitt durch die Ebene −2
  const W = 2.2, D = 1.3, pl = amt_cv(1024, 640, (x, w, h) => { amt_rs = 121; x.fillStyle = '#5e6b48'; x.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { x.fillStyle = `rgba(${amt_R(60, 110) | 0},${amt_R(90, 120) | 0},${amt_R(40, 70) | 0},.35)`; x.fillRect(amt_R(0, w), amt_R(0, h * .72), 2, 2); }
    x.strokeStyle = '#8b8577'; x.lineWidth = 26; x.beginPath(); x.moveTo(40, 250); x.lineTo(w - 40, 250); x.stroke(); x.beginPath(); x.moveTo(500, 40); x.lineTo(500, 440); x.stroke(); x.lineWidth = 14; x.beginPath(); x.moveTo(500, 250); x.quadraticCurveTo(700, 150, 860, 70); x.stroke();
    const g = x.createRadialGradient(840, 380, 10, 840, 380, 90); g.addColorStop(0, '#050505'); g.addColorStop(.7, '#1a1712'); g.addColorStop(1, 'rgba(26,23,18,0)'); x.fillStyle = g; x.beginPath(); x.arc(840, 380, 90, 0, 7); x.fill(); // die Senke
    x.fillStyle = '#e8e2cc'; x.font = 'bold 18px Arial'; x.fillText('OBJEKT', 808, 386);
    x.fillStyle = '#3f3a33'; x.fillRect(0, h * .72, w, h * .28); x.strokeStyle = '#d9d2bc'; x.lineWidth = 3; const ry = h * .8; // Schnitt Ebene −2
    [[60, 90, 'Keller 7'], [170, 150, 'Tunnel'], [340, 110, 'Archiv'], [470, 70, 'Sich.'], [560, 100, 'Prüf 3'], [680, 170, 'Gang'], [870, 110, 'Messraum']].forEach(([px, pw, t]) => { x.strokeRect(px, ry, pw, 70); x.fillStyle = '#d9d2bc'; x.font = '15px Arial'; x.fillText(t, px + 6, ry + 20); });
    x.fillStyle = '#d9d2bc'; x.font = 'bold 20px Arial'; x.fillText('EBENE −2', 20, h - 16); });
  amt_boden(new THREE.MeshStandardMaterial({ map: amt_tex(pl), roughness: .85 }), cx, cz, W, D, PI, ty + .004);
  // Häuser (echte Scans, 1:87): Ahornstraße Nr. 1–7, Hof, Tankstelle, Kapelle; Nr. 3 in Alufolie
  const hs = [[-.55, -.25, K.kSchuppe], [-.35, -.27, K.kSchuppe2], [-.05, -.25, K.kFolie], [.2, -.26, K.kSchuppe], [-.55, .05, K.kSchuppe2], [-.3, .06, K.kSchuppe], [.02, .06, K.kSchuppe2], [.32, .2, K.kSchuppe]];
  for (const [dx, dz, KK] of hs) amt_put(KK, cx - dx, cz - dz, { ry: amt_R(-.2, .2) + PI, y: ty + .006 });
  amt_put(K.kModellKirche, cx - .72, cz + .38, { ry: 2.6, y: ty + .006 }); { const tg = amtp_tankstelle(); tg.position.set(cx + .46, ty + .002, cz - .05); tg.rotation.y = .15; scene.add(tg); S.tankstelle = tg; }
  // Pappschild „Pfand hier abgeben“ an der Modell-Tankstelle: Pappe auf einem Holzspieß, mit Filzstift beschriftet
  { const pk = amtp_baue([[amtp_cyl(.0012, .075, 6), 'holz', amtp_m(0, .0375, 0)], [new THREE.BoxGeometry(.1, .05, .0022), 'karton', amtp_m(0, .085, 0)]], { cast: false });
    const tx = amtp_schild(amt_cv(256, 128, (x, w, h) => { x.fillStyle = '#c9b388'; x.fillRect(0, 0, w, h); for (let i = 0; i < 200; i++) { x.fillStyle = `rgba(90,70,40,${amt_R(.05, .2)})`; x.fillRect(amt_R(0, w), amt_R(0, h), 2, 1); } x.fillStyle = '#1b1b1b'; x.font = 'bold 54px Caveat'; x.textAlign = 'center'; x.fillText('Pfand hier', w / 2, 58); x.fillText('abgeben', w / 2, 112); }), .096, .046, { rough: .9 });
    tx.position.set(0, .085, -.0013); tx.rotation.y = PI; pk.add(tx); pk.position.set(cx + .36, ty + .006, cz - .12); pk.rotation.y = PI + .3; scene.add(pk); S.pfandSchild = pk; }
  // Pappkuppel über der Senke (Halbkugel aus Wellpappe, mit Streifen „OBJEKT“)
  { const dm = new THREE.MeshStandardMaterial({ roughness: .95, bumpMap: amtp_noise(), bumpScale: 1.2, side: THREE.DoubleSide, map: amt_tex(amt_cv(512, 256, (x, w, h) => { amt_rs = 5; x.fillStyle = '#a58a60'; x.fillRect(0, 0, w, h); for (let i = 0; i < h; i += 5) { x.fillStyle = (i / 5) % 2 ? 'rgba(80,58,30,.22)' : 'rgba(255,230,180,.12)'; x.fillRect(0, i, w, 3); } for (let i = 0; i < 700; i++) { x.fillStyle = `rgba(60,40,20,${amt_R(.05, .22)})`; x.fillRect(amt_R(0, w), amt_R(0, h), amt_R(1, 5), 1); }
      x.fillStyle = 'rgba(220,210,170,.55)'; x.fillRect(0, h * .46, w, 3); x.fillRect(w * .25, 0, 3, h); x.fillRect(w * .75, 0, 3, h); })) });
    const dg = new THREE.SphereGeometry(.078, 30, 14, 0, PI * 2, 0, PI / 2); dg.scale(1, .7, 1); const dome = new THREE.Mesh(dg, dm); dome.castShadow = true; dome.receiveShadow = true; dome.position.set(cx - .69, ty + .004, cz - .12); scene.add(dome); S.pappKuppel = dome;
    const ob = amtp_schild(amt_cv(192, 56, (x, w, h) => { x.fillStyle = '#e8e2cc'; x.fillRect(0, 0, w, h); x.fillStyle = '#7a1c14'; x.font = 'bold 40px Arial'; x.textAlign = 'center'; x.fillText('OBJEKT', w / 2, 42); }), .08, .023, { rough: .8 }); ob.position.set(cx - .69, ty + .03, cz - .12 - .07); ob.rotation.x = -.8; ob.rotation.y = PI; scene.add(ob); }
  // Pappfiguren: Hilde am Faden über der Kreuzung, Luke (gestreiftes Hemd, Lampe), DREIPUNKT (weiß, Zettel „Standort?“), EISEN (grau, unbemalt)
  const figur = (art) => amt_cv(64, 128, (x, w, h) => { x.clearRect(0, 0, w, h); const col = { hilde: '#6b5a7a', luke: '#335577', drei: '#f0efe8', eisen: '#8d9093' }[art]; x.fillStyle = col; x.beginPath(); x.arc(32, 22, 11, 0, 7); x.fill(); x.fillRect(20, 34, 24, 56); x.fillRect(22, 90, 8, 34); x.fillRect(34, 90, 8, 34);
    if (art === 'luke') { x.fillStyle = '#e8e4d8'; for (let y = 38; y < 88; y += 8) x.fillRect(20, y, 24, 3); x.fillStyle = '#ffe9a0'; x.fillRect(46, 50, 10, 6); } if (art === 'hilde') { x.fillStyle = '#ddd'; x.fillRect(31, 0, 2, 12); } if (art === 'eisen') { x.fillStyle = '#6a6d70'; x.fillRect(22, 12, 20, 6); } });
  const fig = (art, x, z, hgt = .034) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(hgt * .5, hgt), new THREE.MeshStandardMaterial({ map: amt_tex(figur(art)), transparent: true, alphaTest: .4, side: THREE.DoubleSide, roughness: .8 })); m.position.set(x, ty + .004 + hgt / 2, z); m.userData.noCol = true; scene.add(m); return m; };
  S.hildeFig = fig('hilde', cx, cz - .05); S.hildeFig.position.y = ty + .22;
  { const fy0 = ty + .22 + .017, th = new THREE.Mesh(amtp_cyl(.0011, C2.h - fy0, 5), amtp_mat('papier')); th.position.set(cx, fy0 + (C2.h - fy0) / 2, cz - .05); th.userData.noCol = true; th.castShadow = false; scene.add(th); S.faden = th;   // die Frau hängt an einem Faden von der Decke
    const kl = amtp_baue([[new THREE.BoxGeometry(.03, .0008, .02), 'papier', amtp_m(cx, C2.h - .0004, cz - .05)]], { cast: false }); scene.add(kl); }
  fig('drei', cx - .93, cz + .32, .026); const fe = fig('eisen', cx + .95, cz - .52, .036); fe.position.y += .012;
  // Zettel „DREIPUNKT · Standort?“ als Fähnchen an einer Stecknadel neben der weißen Figur
  { const fl = new THREE.Group(); fl.add(new THREE.Mesh(amtp_cyl(.0008, .06, 5), amtp_mat('stahl'))); fl.children[0].position.y = .03; const zt = amtp_schild(amt_cv(192, 112, (x, w, h) => { x.fillStyle = '#ece4c6'; x.fillRect(0, 0, w, h); x.fillStyle = '#1f2a55'; x.font = '34px Caveat'; x.fillText('DREIPUNKT', 10, 44); x.fillText('Standort?', 10, 92); }), .055, .032, { rough: .85 }); zt.position.set(.03, .05, 0); zt.material.side = THREE.DoubleSide; fl.add(zt); fl.position.set(cx - .9, ty + .004, cz + .32); fl.rotation.y = PI + .4; scene.add(fl); }
  // Sockel der grauen Figur mit eingeritzter Gravur „EISEN“
  { const sk = amtp_baue([[amtp_rbox(.075, .012, .034, .002), 'holz', amtp_m(cx + .95, ty + .006, cz - .52)]], { cast: false }); scene.add(sk);
    const gr = amtp_schild(amt_cv(256, 64, (x, w, h) => { x.fillStyle = '#6a4a30'; x.fillRect(0, 0, w, h); x.font = 'bold 44px Arial'; x.textAlign = 'center'; x.fillStyle = 'rgba(255,230,190,.55)'; x.fillText('EISEN', w / 2 + 1.5, 46); x.fillStyle = '#1e1208'; x.fillText('EISEN', w / 2, 44); }), .06, .0094, { rough: .85 }); gr.position.set(cx + .95, ty + .006, cz - .52 - .0171); gr.rotation.y = PI; scene.add(gr); }
  S.lukeFig = fig('luke', 0, 0, .03); S.lukeWeg = [[-1.0, .52], [-.8, .52], [-.45, .52], [-.2, .52], [0, .52], [.2, .5], [.62, .5], [.62, .52]]; amt_modellLuke(amt_S.modellN || 0);
  const ms = amt_cv(512, 96, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#c9a45a'); g.addColorStop(1, '#7a5a2a'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = '#2a1e10'; x.font = 'bold 26px Georgia'; x.fillText('Lost Eyengless · Maßstab 1 : 87 · Zyklus 42', 18, 58); });
  amt_flaeche(amt_decal(ms, { rough: .3, metal: .8 }), cx, ty - .03, cz - D / 2 - .012, .42, .08, PI);
  const reim = amt_cv(1024, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(40,28,18,.8)'; x.fillStyle = 'rgba(40,28,18,.55)'; x.font = '34px Caveat'; x.fillText('eins, zwei, drei, vier, fünf, sechs, sieben, eins von uns ist drin geblieben, acht ist keins und neun ist keins, dreh dich um …', 10, 70); });
  S.reim = amt_flaeche(amt_decal(reim), cx, ty - .02, cz + D / 2 + .012, 1.3, .06, 0);
  amt_hit(cx, ty + .1, cz, 2.3, .3, 1.4, 'Das Modelldorf', () => amt_modell());
  amt_hit(cx, ty - .03, cz + D / 2 + .04, 1.3, .1, .08, 'In die Tischkante geritzt', () => amt_reim());
  [[X0 + 30.8, Z0 + 13.2], [X0 + 37.2, Z0 + 12.9]].forEach(([x, z], i) => K.amt_archivPlatz(x, z, { ry: PI }, i));
  amt_put(K.kStuhl, cx + 1.3, cz + .9, { ry: 2.2 }); amt_put(K.kEimer, X0 + 37.3, Z0 + 8.6, { ry: 1 });
  const plaene = amt_decal(amt_cv(1024, 512, (x, w, h) => { amt_rs = 123; x.clearRect(0, 0, w, h); for (let i = 0; i < 4; i++) { const px = 20 + i * 250; x.fillStyle = '#d9d2bc'; x.fillRect(px, 30, 220, 300); x.strokeStyle = '#3a4a6a'; x.lineWidth = 2; for (let k = 0; k < 12; k++) { x.beginPath(); x.moveTo(px + 20, 60 + k * 20); x.lineTo(px + amt_R(80, 200), 60 + k * 20 + amt_R(-8, 8)); x.stroke(); } x.fillStyle = '#1e1d1b'; x.font = '18px "Special Elite"'; x.fillText('Zyklus ' + [1958, 1975, 1992, 2009][i], px + 20, 350); } }));
  amt_flaeche(plaene, X0 + 34, 1.6, Z0 + 13.845, 2.2, 1.1, PI);
}

// ================================================================ PRÜFRAUM 3: Oma Ernas Foto, Donnerstagsdosen, Karteikasten K
async function amt_bauPruef(S, K) {
  const X0 = C2.x, Z0 = C2.z;
  const foto = amt_cv(300, 380, (x, w, h) => { amt_rs = 131; x.fillStyle = '#efe9da'; x.fillRect(0, 0, w, h); x.fillStyle = '#9a7a52'; x.fillRect(16, 16, w - 32, h - 110); x.filter = 'blur(2px)'; x.fillStyle = '#5a4430'; x.beginPath(); x.arc(110, 110, 26, 0, 7); x.fill(); x.fillRect(80, 136, 60, 120); x.fillStyle = '#4a3a2a'; x.beginPath(); x.arc(190, 150, 18, 0, 7); x.fill(); x.fillRect(172, 168, 36, 80); x.fillStyle = '#c2a070'; x.fillRect(140, 180, 36, 8); x.filter = 'none';
    for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(80,60,30,${amt_R(.02, .08)})`; x.fillRect(amt_R(0, w), amt_R(0, h), 1.5, 1.5); } x.fillStyle = '#1c2a55'; x.font = '26px Caveat'; x.fillText('Peter, 8, Sommerfest.', 30, h - 40); });
  const bs = amt_bettOben() || (typeof feuer_bedSpot === 'function' ? feuer_bedSpot() : { x: X0 + 41.6, y: .6, z: Z0 - 4.4 }); const ox = bs.x - .7, oy = bs.y > .2 ? bs.y + .006 : .6;
  S.omaFoto = amt_boden(new THREE.MeshStandardMaterial({ map: amt_tex(foto), roughness: .5 }), ox, bs.z + .05, .09, .115, .6, oy);
  amt_hit(ox, oy + .03, bs.z + .05, .25, .15, .25, 'Ein Foto', () => amt_note('Ein Foto auf der Matratze', 'Oma Erna Kranz, jung, mit einem Jungen an der Hand. Kuli auf dem weißen Rand:\n\n<span class="hand">„Peter, 8, Sommerfest.“</span>', 'oma_foto'));
  // Turm ausgespülter Plastikdosen neben der Klappe in der Tür (Rückfall: Becher; fehlendes Modell: Plastikdosen mit Schraubdeckel), Kreppband „Do.“
  { const dg = amtp_dosenTurm(); dg.position.set(X0 + 36.52, 0, Z0 + 1.2); dg.rotation.y = .3; scene.add(dg); }   // Turm ausgespülter Plastikdosen mit Schraubdeckel und Kreppband „Do.“
  amt_hit(X0 + 36.5, .2, Z0 + 1.25, .35, .4, .35, 'Dosen', () => { toast('Ein Turm ausgespülter Dosen mit Schraubdeckel. Auf jedem Deckel ein Streifen Kreppband: „Do.“', 4200); if (!amt_S.said.do) { amt_S.said.do = 1; setTimeout(() => say([['Donnerstags. Oma hat immer gesagt, sie muss ‚zum Amt‘. Ich dachte, wegen der Rente.', 4600, 'LUKE']]), 1300); } });
  // Karteikasten „VERSUCHSREIHE K“ (Blechkasten mit Karteikarten, amtp_kartei)
  { const kg = amtp_kartei('VERSUCHSREIHE K'); kg.position.set(X0 + 43.6, 0, Z0 - 4.35); kg.rotation.y = .2; scene.add(kg); S.karteiGrp = kg; }
  amt_hit(X0 + 43.6, .25, Z0 - 4.3, .4, .4, .4, 'Karteikasten „VERSUCHSREIHE K“', () => amt_karteiK());
  amt_rauchmelder(X0 + 41, Z0 + 2);
}

// ================================================================ LANGER GANG: tote Rauchmelder, das Fass steht nah am klemmenden Gitter (feuer.js)
async function amt_bauGang(S, K) { const X0 = C2.x, Z0 = C2.z; for (let x = X0 + 50; x < X0 + 106; x += 8) amt_rauchmelder(x + 3.5, Z0 + (x % 16 ? .6 : -.6)); }

// ================================================================ VORRAUM des Messraums (x 706–710): Trennwand mit Tür, Aktenschränke (Versteck für AG-07), Tisch mit Akten
async function amt_bauVorraum(S, K) {
  const X0 = C2.x, Z0 = C2.z, H = C2.h;
  wall('z', X0 + 110, Z0 - 8, Z0 + 8, H, M.plaster, [{ at: Z0, w: 1.5 }], .3);
  S.vorTube = c2Tube(X0 + 108, Z0 - 3, 1.2, 'z', 0xd8ecff, 1.1, 8);
  // Reihe Aktenschränke vor der Nordwand – dahinter ist Platz (Luke kauert dort); am Westende eine Lücke zum Hineinschlüpfen
  [X0 + 107.45, X0 + 108.42, X0 + 109.39].forEach((x, i) => K.amt_archivPlatz(x, Z0 + 5.25, { ry: PI }, i));
  addCol(X0 + 106.95, X0 + 109.85, Z0 + 4.95, Z0 + 5.55, 2);
  S.versteck = { x0: X0 + 106.2, x1: X0 + 109.8, z0: Z0 + 5.65, z1: Z0 + 7.8 };
  [X0 + 107, X0 + 108.1].forEach((x, i) => K.amt_archivPlatz(x, 0, { ry: 0, minZ: Z0 - 7.83 }, i + 1));
  const vt = amt_put(K.kTisch, X0 + 108.9, Z0 - 5.9, { ry: PI / 2, s: .45 }); const vty = K.kTisch ? amt_top(K.kTisch, vt, X0 + 108.9, Z0 - 5.9) : .76;
  amt_put(K.kRoehre, X0 + 108.9, Z0 - 6.2, { ry: PI + .4, y: vty }); /* QA 09.10.: crt-Bildschirm bei +x → zum Stuhl (vorher seitlich) */ amt_put(K.kStuhl, X0 + 108.3, Z0 - 5.3, { ry: 1.6 }); amt_put(K.kSack, X0 + 106.6, 0, { ry: .4, s: .8, minZ: Z0 - 7.8 });
  // Butterbrotpapier (Atempause nach AG-07), sauber gefaltet, vor dem Schrank
  const bb = amt_cv(128, 128, (x, w) => { x.clearRect(0, 0, w, w); x.fillStyle = 'rgba(236,232,214,.92)'; x.beginPath(); x.moveTo(10, 30); x.lineTo(110, 18); x.lineTo(118, 100); x.lineTo(20, 112); x.fill(); x.strokeStyle = 'rgba(160,150,120,.6)'; x.lineWidth = 2; x.beginPath(); x.moveTo(12, 70); x.lineTo(116, 60); x.stroke(); x.fillStyle = 'rgba(200,170,80,.25)'; x.beginPath(); x.arc(70, 40, 16, 0, 7); x.fill(); });
  S.butterbrot = amt_boden(amt_decal(bb), X0 + 108.3, Z0 + 4.55, .16, .16, .7); S.butterbrot.visible = false;
  S.butterHit = amt_hit(X0 + 108.3, .06, Z0 + 4.55, .35, .12, .35, '', () => {}); uninteract(S.butterHit);
  amt_rauchmelder(X0 + 108, Z0);
}

// ================================================================ MESSRAUM: Stuhl 8 (Feder, Kerbe, Zeichnung „PAPA + ICH“ mit halbem Mond, SB-04), Kette, zweiter Drucker, Notbeleuchtung
const AMT_ST8 = { x: C2.x + 118.6, z: C2.z + 5 };
async function amt_bauMessraum(S, K) {
  const X0 = C2.x, Z0 = C2.z, s8 = AMT_ST8;
  // Kette der Luke: aufgerollt auf dem Tankdeckel, unter der Luke
  S.kette = K.kKette ? amt_einzel(K.kKette, X0 + 118.2, 2.66, Z0 + 6.7, { ry: .8, noCol: true }) : null;
  // Zeichnung vor dem leeren Stuhl: Strichmännchen mit Hut und Zacken, ein kleines daneben, „PAPA + ICH“, signiert mit einem halben Mond
  const z8 = amt_cv(300, 420, (x, w, h) => { amt_rs = 141; amt_papier(x, w, h, { bg: '#ece6d6', flecken: 5 }); x.lineCap = 'round'; x.strokeStyle = '#6a6d72'; x.lineWidth = 7; x.beginPath(); x.moveTo(110, 130); x.lineTo(110, 300); x.moveTo(70, 190); x.lineTo(150, 190); x.moveTo(110, 300); x.lineTo(85, 380); x.moveTo(110, 300); x.lineTo(135, 380); x.stroke(); x.beginPath(); x.arc(110, 104, 26, 0, 7); x.stroke();
    x.beginPath(); x.moveTo(78, 82); x.lineTo(90, 64); x.lineTo(100, 80); x.lineTo(110, 60); x.lineTo(120, 80); x.lineTo(130, 64); x.lineTo(142, 82); x.stroke(); // Hut mit Zacken
    x.strokeStyle = '#4a3a2a'; x.lineWidth = 5; x.beginPath(); x.moveTo(200, 250); x.lineTo(200, 330); x.moveTo(178, 280); x.lineTo(222, 280); x.moveTo(200, 330); x.lineTo(186, 380); x.moveTo(200, 330); x.lineTo(214, 380); x.stroke(); x.beginPath(); x.arc(200, 234, 15, 0, 7); x.stroke();
    x.strokeStyle = '#6a6d72'; x.lineWidth = 4; x.beginPath(); x.moveTo(150, 190); x.lineTo(186, 278); x.stroke(); x.fillStyle = '#2040c0'; x.font = 'bold 40px Caveat'; x.fillText('PAPA + ICH', 60, 40);
    x.fillStyle = '#c9a040'; x.beginPath(); x.arc(250, 395, 14, PI * .5, PI * 1.5); x.fill(); });
  S.papa = amt_boden(new THREE.MeshStandardMaterial({ map: amt_tex(z8), roughness: .95 }), s8.x - .05, s8.z - .62, .24, .34, PI + .08, .014);
  amt_hit(s8.x - .05, .08, s8.z - .62, .35, .15, .45, 'Zeichnung vor dem leeren Stuhl', () => amt_note('Vor dem achten Stuhl', 'Buntstift. Ein Strichmännchen mit Hut und Zacken, daneben ein kleines. Sie halten sich an der Hand.\n\nDarüber, in Kinderschrift: <b>PAPA + ICH</b>.\n\nUnten in der Ecke, statt eines Namens: ein halber Mond.', 'papa_ich'));
  // Feder in der Kerbe (Decal) und Klebeband unter der Sitzfläche
  const fed = amt_cv(64, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#1a1a1c'; x.lineWidth = 2; x.beginPath(); x.moveTo(32, 250); x.lineTo(32, 10); x.stroke(); for (let y = 20; y < 230; y += 3) { const l = 26 * Math.sin((y / 240) * PI) + 4; x.strokeStyle = `rgba(${18 + (y % 7)},${18 + (y % 5)},${24 + (y % 9)},.9)`; x.beginPath(); x.moveTo(32, y); x.lineTo(32 - l, y - 10); x.moveTo(32, y); x.lineTo(32 + l * .9, y - 9); x.stroke(); } x.fillStyle = 'rgba(80,90,120,.25)'; x.fillRect(20, 40, 24, 120); });
  S.feder = amt_flaeche(amt_decal(fed, { rough: .45 }), s8.x, .78, s8.z, .05, .2, 0, .5); S.feder.visible = false; // in der Kerbe der Stuhllehne (Stuhlkreis aus innen_kapitel)
  { const k = typeof innen_kapitel_S !== 'undefined' && innen_kapitel_S.stuhlKreis ? innen_kapitel_S.stuhlKreis[7] : null; if (k) { S.feder.position.set(k.x - Math.sin(k.ry) * .215, .8, k.z - Math.cos(k.ry) * .215); S.feder.rotation.set(0, k.ry + PI, .45, 'YXZ'); } }
  { const SK = typeof innen_kapitel_S !== 'undefined' ? innen_kapitel_S.stuhlKreis : null; // Lederriemen an allen acht Stühlen; an Stuhl 8 sauber durchtrennt, mit Kerbe in der Lehne
    if (SK) SK.forEach((k, i) => { const g = amtp_gurte(i === 7); g.position.set(k.x, 0, k.z); g.rotation.y = k.ry; scene.add(g); if (i === 7) S.stuhl8Gurte = g; }); }
  S.feder.visible = true; // die Feder steckt von Anfang an in der Kerbe
  amt_hit(s8.x, .75, s8.z, .6, 1.1, .6, 'Stuhl 8', () => amt_stuhl8());
  if (typeof sammeln_platz === 'function') try { sammeln_platz('SB-04', { x: s8.x, y: .3, z: s8.z, ab: 2, unsichtbar: 1, hb: .3, label: 'Unter der Sitzfläche, mit Klebeband' }); } catch (e) { console.warn('amt SB-04', e); }
  // Zweiter Nadeldrucker auf dem Seitentisch (erscheint erst mit seinem Druck)
  S.messDruck = { x: X0 + 114.0, y: 1.0, z: Z0 - 7.5 }; // zweiter Nadeldrucker auf dem Seitentisch, Papier liegt auf der Platte
  { const g = new THREE.Group(); g.add(amtp_drucker()); g.add(amtp_band([[0, .12, 0], [0, .15, .04], [0, .185, .075], [0, .195, .12], [0, .15, .2], [0, .02, .29], [0, .004, .42]], .22, S.papierMat, { n: 36, fromTop: true, vSpan: .42 }));
    g.position.set(X0 + 114.0, .79, Z0 - 7.52); g.rotation.y = 0; g.visible = false; scene.add(g); S.messDruckObj = g; }
  // Notbeleuchtung (Batterie-Notleuchten, beim Laden 0): nach dem Sterben der Röhren – Licht für „Ihre Augen“ und den Aufstieg
  const nl = amt_decal(amt_cv(256, 96, (x, w, h) => { x.fillStyle = '#e8eee6'; x.fillRect(4, 4, w - 8, h - 8); x.fillStyle = '#1c7a3a'; x.fillRect(16, 16, w - 32, h - 32); x.fillStyle = '#fff'; x.font = 'bold 30px Arial'; x.fillText('NOTLICHT', 40, 60); }), { em: 0xffffff, emI: 0 });
  S.notlicht = []; for (const [x, y, z, ry] of [[X0 + 110.17, 2.2, Z0 + 4.6, PI / 2], [X0 + 121.83, 2.2, Z0 - 3.5, -PI / 2], [X0 + 116.5, 2.2, Z0 + 7.83, PI]]) {
    const m = amt_flaeche(nl, x, y, z, .3, .11, ry); const l = new VLight(0xd4ffe0, 0, 7, 2); l.position.set(x + (ry === PI / 2 ? .25 : ry === -PI / 2 ? -.25 : 0), y - .1, z + (ry === PI ? -.25 : 0)); scene.add(l); S.notlicht.push({ m, l }); }
  S.notlichtAn = 0;
}

// =====================================================================  HANDLUNGEN
// UK1: Nummer ziehen – immer die 8
function amt_nummer() { const S = amt_S; if (S.nr) return toast('„Bitte ziehen Sie eine Nummer.“ Der Schlitz ist leer. Es gab nur die eine.', 3200);
  S.nr = true; Audio.play('switch1', { gain: .4, rate: 1.3, x: C2.x + 15.4, y: 1.2, z: C2.z - 1.8, ref: 2 }); amt_nadel(C2.x + 15.4, 1.1, C2.z - 1.8, 1, .35);
  if (S.nrZettel) { S.nrZettel.visible = true; setTimeout(() => { if (S.nrZettel) S.nrZettel.visible = false; }, 1600); }
  setTimeout(() => { addItem('wartenummer'); say([['Klar. Natürlich. Was denn sonst.', 3000, 'LUKE']]); }, 900); }
// UK4: Funk vor dem ersten Hebel (AG-06, Wortlaut Dossier 80; danach Lukes Gedanke aus dem Kapitel)
async function amt_ag06() { if (ch2.ag06 || amt_S.ag06Busy) return; amt_S.ag06Busy = true; ch2.ag06 = amt_S.ag06 = true; const F = amt_S.funkPos || { x: C2.x + 30.5, z: C2.z + 4.9 };
  try { state.talking = true; Audio.play('switch2', { gain: .3, rate: 1.6, x: F.x, y: 1, z: F.z, ref: 2 }); await wait(700);
    const B = (typeof LWO_AG !== 'undefined' && LWO_AG['AG-06']) ? LWO_AG['AG-06'].schritte.filter(s => Array.isArray(s) && (s[0] === 'F' || s[0] === 'FW')) : [['F', '„Bergung zwei an Nachsorge. K-1 nicht im Käfig.“'], ['FW', '„Verstanden. Das ist bedauerlich.“']];
    for (const s of B) { if (typeof lwo_zeile === 'function') await lwo_zeile(s[0], s[1], s[2] || {}, { funkAt: { x: F.x, z: F.z } }); else { subtitle(s[1], 4000, 'FUNK'); await wait(4000); } await wait(300); }
    try { lwo_S.seen['ag:AG-06'] = 2; } catch (e) {}
    await wait(600); await say([['Die sind hier. Heute Nacht. Und irgendwas ist nicht im Käfig.', 3800, 'LUKE']]);
  } finally { state.talking = false; amt_S.ag06Busy = false; amt_S.k1.ab = amt_S.t; } }
// A-06: falscher Hebel – beim zweiten meldet der Drucker K-1, beim dritten kratzt es außen an der Tür
function amt_fuseFalsch(n) { if (n === 2) amt_druck('K-1 · GERÄUSCH · SICHERUNG'); if (n === 3) setTimeout(() => amt_kratzen(C2.x + 33, 1.0, C2.z + 1.7, 3, 1.2), 1500); }
// UK4: Notstrom – Röhren zucken, Kühlaggregat springt an und stirbt, AG-05 („… Bruder.“, „Ja, Luke.“), stiller Speicherpunkt
async function amt_notstrom() { const S = amt_S; amt_uhr(2, 10);
  try { Audio.play('machine1', { gain: .35, dur: 2.2, lp: 700, x: C2.x + 35.3, y: 1.1, z: C2.z + 3.55, ref: 3 }); } catch (e) {}
  amt_druck('RÜCKLÄUFER 08 STELLT STROM WIEDER HER.', { still: true });
  await wait(2200); state.talking = true;
  try { await amt_band('Notstrom aktiv. Außenstelle Lost Eyengless.');
    await wait(500); await amt_band('', { schnitte: ['Bitte bringen Sie das Kind barfuß.', 'Bitte bringen Sie das Kind.', 'Bitte bringen Sie …', 'Bruder.'], spieluhr: true });
    await wait(700); await say([['Das ist ein Band. Das ist ein Band, das ist eine Schleife, das …', 3600, 'LUKE']]);
    await amt_band('Ja, Luke.', { kichern: true, spieluhr: true }); await wait(1400);
  } finally { state.talking = false; }
  gedanke('amt_janluke', 'Das war kein Schnitt mehr. Das hat er nie gesagt.', 300, 3);
  setTimeout(() => { try { todCheckpoint('strom', 'Sicherungsraum', { quiet: true }); } catch (e) {} }, 4000); }
// UK5: nach den Spinnen – die Tafel wird hell, das Band schneidet aus seinen Worten, Speicherpunkt
async function amt_nachSpinnen() { const S = amt_S; amt_druck('RÜCKLÄUFER 08 PRÜFRAUM 3: REIZ.', { still: true });
  await wait(2000); const T = typeof innen_kapitel_S !== 'undefined' ? innen_kapitel_S.pruefTafel : null; if (T && T.material) { T.material.emissive = new THREE.Color(0xfff4dc); T.material.emissiveMap = T.material.map; T.material.emissiveIntensity = .55; T.material.needsUpdate = true; S.tafelGlow = 1; }
  state.talking = true;
  try { Audio.intercomClick && Audio.intercomClick(...amt_box0()); await wait(500);
    await say([['Original B., Luke (Vermessung Frühjahr 2009): starke Spinnenangst.', 4200, 'TAFEL'], ['Rückläufer 08 (Sommer 2009): keine Reaktion. Lacht.', 3800, 'TAFEL']]);
    await amt_band('', { schnitte: ['Reaktion …', 'auf Reiz …', 'hoch.', 'Abweichung …', 'von …', 'zweitausendneun.'] });
    await wait(600); await say([['Sie schneidet. Aus seinen Worten. Wie ein Kind, das Erpresserbriefe aus der Zeitung klebt.', 4600, 'LUKE']]); await wait(1400);
    await say([['Und ich hab geschrien. Das Original hätte auch geschrien.', 3600, 'LUKE']]);
  } finally { state.talking = false; }
  try { todCheckpoint('pruef', 'Prüfraum 3'); } catch (e) {} }
// UK3→UK5 Präsenz ohne Kontakt (A-05, 5.3): der Drucker meldet K-1, Kratzen hinter Wänden, ein Schatten unter der Tür von Zimmer 7
function amt_k1Tick(dt) { const S = amt_S, K = S.k1; if (!ch2.ag06 || ch2.chase !== 'idle' || ch2.spiderPhase === 'swarm' || ch2.spiderPhase === 'shake' || state.talking || (typeof kino_S !== 'undefined' && kino_S.on)) return;
  const P = player.pos, X0 = C2.x, Z0 = C2.z;
  if (!K.gang && S.t - (K.ab || 0) > 20) { K.gang = 1; amt_druck('K-1 · BEWEGUNG · GANG OST'); return; }
  if (!K.tuer && ch2.power && P.x > X0 + 34 && P.x < X0 + 36 && Math.abs(P.z - Z0) < 2) { K.tuer = 1; amt_druck('K-1 · TÜR PRÜFRAUM'); return; }
  if (!K.still && ch2.spiderPhase === 'gone' && S.t - (S.spinnenT || 1e9) > 25) { K.still = 1; amt_druck('K-1 · STILLSTAND'); return; }
  if (!K.z7 && typeof z7_in === 'function' && z7_in(.4) && typeof z7_S !== 'undefined' && z7_S.door && !z7_S.door.open) { K.z7 = 1; amt_druck('K-1 · FLUR VOR ZIMMER 7'); setTimeout(() => amt_schatten(), 2600); return; }
  K.t -= dt; if (K.t < 0) { K.t = rand(90, 180); const far = [[X0 + 60, Z0], [X0 + 44, Z0 - 3], [X0 + 90, Z0 + 1], [X0 + 26, Z0 + 5]].find(p => Math.hypot(p[0] - P.x, p[1] - P.z) > 12); if (far) { amt_kratzen(far[0], 1.0, far[1], 2, .8); if (Math.random() < .5) setTimeout(() => { try { Audio.groan(far[0], far[1], false); } catch (e) {} }, 2600); } } }
// Ein Schatten wandert unter der Tür von Zimmer 7 vorbei, bleibt stehen, geht weiter (Decal mit Deckkraft – keine Figur, kein Licht)
function amt_schatten() { const S = amt_S; if (!S.schattenM) { S.schattenM = amt_boden(new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false }), C2.x + 33, C2.z - 2.15, .35, .09, 0, .016); }
  const m = S.schattenM; let t = 0; const iv = setInterval(() => { t += .05; const x = t < 1.2 ? -.7 + t : t < 3 ? .5 : .5 + (t - 3); m.position.x = C2.x + 33 + x * .8; m.material.opacity = (t < .3 ? t / .3 : t > 3.8 ? Math.max(0, 1 - (t - 3.8) / .4) : 1) * .75;
    if (t > 4.2) { clearInterval(iv); m.material.opacity = 0; } }, 50); try { Audio.stepAt(C2.x + 33, C2.z - 1.2, .06); setTimeout(() => Audio.stepAt(C2.x + 33.5, C2.z - 1.2, .05), 700); } catch (e) {} }
// B-K2-03: drei Batterien im Dreieck; der Zettel liegt darunter (AP-07)
function amt_batterien() { const S = amt_S; if (S.batt) return toast('Hier lagen drei Batterien. Im Dreieck. Wer legt Batterien im Dreieck hin?', 3000); S.batt = true; addBattery(3); (S.battObj || []).forEach(g => g.visible = false);
  try { if (typeof beobachter_zettel === 'function') beobachter_zettel('B-K2-03', { pos: [C2.x + 30.55, (S.funkPos && S.funkPos.y || .84) + .005, C2.z + 5.98] }); } catch (e) {} }
function amt_leiterNehmen() { const S = amt_S; if (S.leiter) return; S.leiter = true; addItem('leiter_amt'); if (S.leiterSich) S.leiterSich.visible = false; uninteract(S.leiterHit); Audio.play('woodHit1', { gain: .4, rate: .8, x: C2.x + 35.5, y: 1, z: C2.z + 6.7, ref: 2 }); toast('Eine Holzleiter. Schwer. Sie klappert bei jedem Schritt.', 3000); }
// „Ich habe nicht gefragt, wen“: Leiter am letzten Schrank, hinaufsteigen, Gründungsakte, beim Herabsteigen fehlt die unterste Sprosse
async function amt_gruendung() { const S = amt_S; amt_side('k2_gruendung');
  if (S.gruendung) return toast('Oben auf dem Schrank nur noch Staub, und ein sauberes Rechteck, wo der Deckel lag.', 3000);
  if (!S.leiterSteht) { if (!story.items.includes('leiter_amt')) return toast('Ganz oben auf dem letzten Schrank ragt ein Aktendeckel über die Kante: GRÜNDUNG. Zu hoch. Irgendwo muss eine Leiter sein.', 4600);
    S.leiterSteht = true; story.items = story.items.filter(k => k !== 'leiter_amt'); if (S.leiterArchiv) S.leiterArchiv.visible = true; Audio.play('woodHit2', { gain: .5, rate: .9, x: C2.x + 28, y: 1, z: C2.z - 5, ref: 2 }); return toast('Du stellst die Leiter an den Schrank.', 2200); }
  if (scripted) return; S.gruendung = true; const P = player.pos, y0 = P.y, x0 = P.x, z0 = P.z, tx = C2.x + 28, tz = C2.z - 4.75; let t = 0, ph = 'hoch';
  setScripted(dt => { t += dt; if (ph === 'hoch') { const k = Math.min(1, t / 1.6); P.x += (tx - P.x) * Math.min(1, dt * 6); P.z += (tz - P.z) * Math.min(1, dt * 6); P.y = y0 + .95 * k * k * (3 - 2 * k); if (Math.floor(t * 3) !== S._sp) { S._sp = Math.floor(t * 3); Audio.play('woodHit1', { gain: .12, rate: 1.4, x: tx, y: P.y, z: tz, ref: 2 }); } if (k >= 1) { ph = 'oben'; t = 0; } return true; }
    if (ph === 'oben') return true; if (ph === 'runter') { const k = Math.min(1, t / 1.2); P.y = y0 + .95 * (1 - k * k); if (k >= 1) { ph = 'fertig'; return false; } return true; } return false; });
  await wait(1700); S.gruendDeckel.visible = false; Audio.paper(); amt_druck('RÜCKLÄUFER 08 · UNBEFUGT · ARCHIV OBEN.');
  amt_note('Aktennotiz · Gründung Außenstelle 7', '<span style="font-family:\'Courier New\',monospace;font-size:.93em;line-height:1.55"><b>Aktennotiz zur Einrichtung der Außenstelle 7, Herbst 1958. Verf.: Dr. T. Seiler.</b><br><br>Objekt LICHTSCHIFF bestätigt. Innenraum (vulgo „Nimmerheim“) betreten, nicht vermessbar.<br><br>Überlieferung (Chronik): Die Kinder von 1312 sagten: Die Frau mit der Laterne hat uns rausgeführt, eins nach dem andern. Sie ist noch einmal rein.<br><br>Zwei Exemplare Objekt DREIPUNKT mit Eisennetz gesichert. Eins verstorben bei Bergung, eins in Kühlung, verstorben nach elf Tagen. Das dritte entzieht sich. Gewebe gesichert („Substanz S“).<br><br>Subjekt EISEN ist real. Er altert nicht. Er hat uns zugesehen und nichts getan. Er sagt, er suche jemanden. Ich habe nicht gefragt, wen.<br><br>Zeuge H. Wolter (Rückführung 1941, Schwester Verbleib) tritt in den Dienst. Wünscht Zugang zu Substanz S. Genehmigt.<br><br>Eltern werden nicht informiert. Es genügt, wenn wir es wissen. – Adresse Verf.: Villa am Westweg.</span><br><br><small>Rückseite, Rechnung: „Eisennetz, 2 Stück, Fischereibedarf Hamburg. Vermerk: als ‚Volleyballnetz‘ verbuchen.“</small>', 'gruendung', () => {
    t = 0; ph = 'runter'; setTimeout(() => { if (S.leiterArchiv) S.leiterArchiv.visible = false; amt_sprosse(); Audio.play('woodFall1', { gain: .45, rate: 1.2, x: C2.x + 27, y: .1, z: C2.z - 3.6, ref: 3 }); shake = Math.max(shake, .02);
      setTimeout(() => toast('Die unterste Sprosse fehlt. Sie liegt zwei Meter weiter. Drei Kratzer im Holz.', 4200), 700); }, 1300);
    amt_trust('gruendungsakte'); amt_lore('amt_villa_westweg', 'Villa am Westweg', 'Seilers Aktennotiz, 1958: „Adresse Verf.: Villa am Westweg.“'); amt_sideDone('k2_gruendung', 'Seiler 1958: Die Frau mit der Laterne ist noch einmal rein. Subjekt EISEN sucht jemanden. „Ich habe nicht gefragt, wen.“'); }); }
function amt_sprosse() { const S = amt_S; if (S.sprosse) return; const K = S.K.kLeiter; if (!K) return; // die unterste Sprosse als eigenes Stück (aus der Leiter geschnitten), drei Kratzer als Aufkleber
  const parts = []; for (const p of K.parts) { const P = p.geo.attributes.position, I = p.geo.index, keep = []; const cnt = I ? I.count : P.count; const bb = K.size;
    for (let i = 0; i < cnt; i += 3) { const ids = [0, 1, 2].map(k => I ? I.getX(i + k) : i + k); let ok = true; for (const id of ids) { const y = P.getY(id), x = Math.abs(P.getX(id)); if (y > bb.y * .16 || y < bb.y * .05 || x > bb.x * .36) { ok = false; break; } } if (ok) keep.push(...ids); }
    if (keep.length) { const g = p.geo.clone(); g.setIndex(keep); parts.push(new THREE.Mesh(g, p.mat)); } }
  const grp = new THREE.Group(); parts.forEach(m => { m.castShadow = true; grp.add(m); }); grp.position.set(C2.x + 26.2, -.25, C2.z - 3.4); grp.rotation.set(0, .9, PI / 2 - .05); scene.add(grp); S.sprosse = grp;
  amt_boden(amt_decal(amt_cv(128, 64, (x) => { x.clearRect(0, 0, 128, 64); x.strokeStyle = 'rgba(230,220,200,.7)'; x.lineWidth = 2; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(30 + i * 22, 10); x.lineTo(40 + i * 22, 54); x.stroke(); } })), C2.x + 26.2, C2.z - 3.4, .2, .1, .9, .03); }
// „Nicht füttern“: neun Streifen, drei Zeilen – nach den abgerissenen Rändern (kein Fehlschlag); der Vernichter frisst den Rest
function amt_vernichter() { const S = amt_S; amt_side('k2_fuettern');
  if (S.vernichter) return amt_note('Bestandsliste (Fetzen)', AMT_FETZEN_HTML, null);
  const Z = [['… Probe T · Weiher', 'Dustwoods · nicht', 'bergen · zieht …'], ['… Probe C (der Chor) ·', '12 Gläser · singen nachts ·', 'verlegt Außenstelle 3 …'], ['… Kiste 41 · LEBEND ·', 'NICHT FÜTTERN · verlegt', '2012 · Empfänger ████ …']];
  const L = []; Z.forEach((r, zi) => r.forEach((t, si) => L.push({ t, zi, si }))); for (let i = L.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [L[i], L[j]] = [L[j], L[i]]; }
  const lage = [[null, null, null], [null, null, null], [null, null, null]];
  const html = () => `<h3>STREIFEN</h3><p>Neun Streifen aus dem Schlitz. Die abgerissenen Ränder passen nur auf eine Art.</p><div style="display:flex;flex-direction:column;gap:6px;margin:10px 0">${lage.map(r => `<div style="display:flex;gap:4px;min-height:34px;background:rgba(0,0,0,.25);padding:4px">${r.map(s => `<span style="flex:1;font:13px 'Courier New',monospace;color:#1b1b1b;background:${s ? '#e6e0cc' : 'transparent'};padding:6px 4px;clip-path:polygon(0 0,100% 6%,97% 100%,3% 94%)">${s ? s.t : ''}</span>`).join('')}</div>`).join('')}</div>
    <div class="slots">${L.map((s, i) => s.lag ? '' : `<button data-i="${i}" style="min-width:150px;height:auto;padding:10px 6px;font-size:12px">${s.t}</button>`).join('')}</div>`;
  const auf = () => openPuzzle(html(), box => box.querySelectorAll('button[data-i]').forEach(b => b.onclick = e => { e.stopPropagation(); const s = L[+b.dataset.i]; s.lag = true; lage[s.zi][s.si] = s; Audio.paper();
    const fertig = lage.filter(r => r.every(Boolean)).length; if (fertig === 3) { closeOverlay(); amt_vernichterFertig(); } else { closeOverlay(); setTimeout(auf, 60); } }));
  auf(); }
const AMT_FETZEN_HTML = '<span style="font-family:\'Courier New\',monospace">„… Probe T · Weiher Dustwoods · nicht bergen · zieht …“<br>„… Probe C (der Chor) · 12 Gläser · singen nachts · verlegt Außenstelle 3 …“<br>„… Kiste 41 · LEBEND · NICHT FÜTTERN · verlegt 2012 · Empfänger ████ …“<br><br>Ein vierter Streifen, noch im Schlitz, lesbar nur:<br>„… W · Wirt: Hofer …“</span>';
async function amt_vernichterFertig() { const S = amt_S; S.vernichter = true; await wait(600);
  try { Audio.play('machine1', { gain: .5, rate: 1.6, dur: 1.4, x: C2.x + 19.05, y: .6, z: C2.z + 5.25, ref: 2 }); } catch (e) {} if (S.streifen) S.streifen.visible = false; shake = Math.max(shake, .01);
  await wait(1500); amt_lore('amt_bestandsliste', 'Bestandsliste (Fetzen)', AMT_FETZEN_HTML); amt_note('Bestandsliste (Fetzen)', AMT_FETZEN_HTML, null);
  await wait(400); say([['Der hat gerade Beweise vernichtet. Der ist besser eingearbeitet als ich.', 4000, 'LUKE']]);
  amt_sideDone('k2_fuettern', 'Probe T, Probe C, Kiste 41 – LEBEND, NICHT FÜTTERN. Und: „W · Wirt: Hofer“.');
  setTimeout(() => { if (!S.said.max8) { S.said.max8 = 1; gedanke('amt_max8', 'Max. 8 Blatt. Acht. Natürlich acht.', 0, 1); } }, 9000); }
// „Dasselbe Kleid“: Zahlenschloss mit vier Feldern (1958 · 1975 · 1992 · 2009)
function amt_zahlenschloss() { const S = amt_S; amt_side('k2_kleid'); S.regTry = S.regTry || 0; const J = S.regEingabe || ['0000', '0000', '0000', '0000'];
  openPuzzle(`<h3>ZAHLENSCHLOSS</h3><p>Vier Felder, je vier Ziffern. Darunter, mit Kreide: <i>„Alle siebzehn.“</i></p><div class="row" style="gap:10px">${J.map((v, i) => `<input data-i="${i}" maxlength="4" inputmode="numeric" value="${v}" style="width:78px;font:22px 'Courier New',monospace;text-align:center;background:#1a1916;color:#e6dcc4;border:1px solid #6a5a3a;padding:6px">`).join('')}</div><div class="row"><button id="rgOk">PRÜFEN</button></div>`, box => {
    const ins = [...box.querySelectorAll('input')]; ins.forEach(i => { i.onkeydown = e => e.stopPropagation(); i.oninput = () => { i.value = i.value.replace(/\D/g, '').slice(0, 4); S.regEingabe = ins.map(q => q.value.padStart(4, '0')); }; }); setTimeout(() => ins[0].focus(), 50);
    box.querySelector('#rgOk').onclick = e => { e.stopPropagation(); const v = ins.map(q => q.value);
      if (v.join() === '1958,1975,1992,2009') { closeOverlay(); S.reg = true; S.tuer.reg.locked = false; Audio.play('lockOpen', { gain: .5, x: C2.x + 18, y: 1, z: C2.z - 4.6, ref: 2 }); toast('Das Schloss springt auf.', 2200); saveGame(2); return; }
      Audio.beep(false); S.regTry++; if (v.join() === '2009,1992,1975,1958') subtitle('Richtig gerechnet, falsch herum. Das älteste zuerst.', 3400, 'LUKE'); else if (S.regTry === 2) subtitle('Alle siebzehn Jahre. Von 2009 rückwärts. Und dann das älteste zuerst.', 4200, 'LUKE'); else if (S.regTry === 4) subtitle('Vier Felder, vier Jahre. 2009 minus 17, minus 17, minus 17. Das älteste links.', 4200, 'LUKE'); }; }); }
// Die vier Hängemappen: Foto + Belegkarte + Rückseite; dann liegen sie nebeneinander auf dem Tisch
const AMT_REG = [
  ['1958', 'Schwarzweiß, Zackenrand. Sieben Kinder mit Lampions vor der Kapelle. Am Rand ein blasses Mädchen im weißen Sommerkleid, barfuß. Ein kleiner Junge mit einem Kinderfahrrad, das zu groß für ihn ist. Ganz links, halb hinter dem Fotografen, ein Mann in grauem Mantel mit Hut.', 'Belegkarte: „Das Mädchen war wieder da. Auswahl so bestätigt. – T. S.“', 'Rückseite: „Rieke, Hans, 6 – Verbleib.“'],
  ['1975', 'Farbe, orange verblichen. Ein Junge mit Stirnband. Ein Mädchen mit Zöpfen und Butterblume. Ein Mädchen, das in die falsche Richtung guckt. Am Rand: dasselbe Mädchen, dasselbe Kleid, gleich alt. Am anderen Rand: derselbe Mann, gleich alt.', 'Stempel: „ERSCHEINUNGSFORM B ANWESEND.“', 'Rückseite: „Hofer, A., 9 – Verbleib.“'],
  ['1992', 'Sieben Kinder vor dem Schützenzelt, in der Mitte ein Pfarrer mit Lampion, mit Kuli durchgestrichen. Am Rand: das Mädchen. Am anderen Rand: der Mann, jetzt mit Thermoskanne.', 'Belegkarte: „Filmkosten 14,80 DM, Erstattung beantragt. Abgelehnt: Kein Dienstfoto ohne Dienstsiegel.“', 'Rückseite: „Pfarrer entfernt. Bericht (hw).“'],
  ['2009', 'Das Original der Archivkopie, in Farbe. Lucy sieht das Mädchen an, als Einzige. Der Mann steht diesmal direkt hinter den Kindern, eine Hand auf Zayns Schulter. Lederhandschuh im Juli.', '', 'Rückseite: „Belegfoto. B anwesend. Auswahl bestätigt. Sieben Lampions ausgegeben.“']];
function amt_regMappen() { const S = amt_S; S.regFotos = S.regFotos || 0; if (S.regFotos >= 4) return amt_note('Vier Sommerfeste', AMT_REG.map(r => '<b>' + r[0] + '</b> · ' + r[1]).join('\n\n'), null);
  const i = S.regFotos, [j, bild, beleg, rueck] = AMT_REG[i], c = amt_regFoto(i, false), url = c.toDataURL('image/jpeg', .85);
  amt_note('Hängemappe ' + j, `<img src="${url}" style="display:block;width:100%;max-width:440px;margin:0 auto 10px;box-shadow:0 3px 12px rgba(0,0,0,.5);transform:rotate(${i % 2 ? .6 : -.8}deg)">${bild}${beleg ? '\n\n<span class="hand">' + beleg + '</span>' : ''}\n\n<small>${rueck}</small>`, 'reg_' + j, () => {
    S.regFotos = i + 1; if (S.regFotoMesh && S.regFotoMesh[i]) S.regFotoMesh[i].visible = true;
    try { if (typeof album_abheften === 'function') album_abheften('k2_sommerfest_' + j, { bild: url, serie: 'sonst', art: 'abzug', notiz: 'Sommerfest ' + j, datum: '5.11.', hinten: rueck.replace(/^Rückseite: /, '') }); } catch (e) {}
    if (i === 2) try { if (typeof tausch_gib === 'function') tausch_gib('abzeichen'); toast('In der Mappe steckt noch etwas: ein Blechabzeichen, „Laternenfest 1992“.', 3800); } catch (e) {}
    if (i === 3) { say([['Dasselbe Kleid. Und derselbe Mantel. Die altert nicht, der altert nicht. Sowas gibt’s nur bei Aliens und Beamten.', 5200, 'LUKE']]);
      amt_trust('registratur'); amt_lore('amt_grauer_mantel', 'Der Mann im grauen Mantel', 'Auf jedem Sommerfest seit 1958 derselbe Mann im grauen Mantel mit Hut, gleich alt. 1992 mit Thermoskanne. 2009 mit einer Hand auf Zayns Schulter, Lederhandschuh im Juli.');
      amt_sideDone('k2_kleid', 'Vier Sommerfeste, dasselbe Mädchen, derselbe Mann im grauen Mantel.'); S.regDrehen = true; } }); }
// Kantine
function amt_brett() { const S = amt_S; amt_side('k2_kantine'); amt_note('Schwarzes Brett', '<span class="hand">„Dienstsiegel NICHT an Kinder verleihen. Auch nicht ‚nur zum Gucken‘.“</span>\n\n„Rückläufer werden nicht geduzt, nicht gefüttert, nicht ‚mal kurz mit hochgenommen‘.“\n\nGerahmt: „Wir sind die, die nachts aufbleiben, damit die anderen schlafen. Jedes Kind, das wir zurückholen, ist eins, das es nicht behält. Unruhe tötet mehr als das Objekt. SEHEN · BERGEN · SCHWEIGEN.“\n\nZittrig, März 2012:\n<span class="hand">„Außenstelle wird geschlossen. Die Liste endet. Wer 2026 noch hier ist: Gott steh Lost Eyengless bei. Ohne Liste nimmt sie, wen sie will.“</span>', 'brett', () => {
  if (!S.brett) { S.brett = true; setTimeout(() => amt_kaffeeSchreck(), 2500); amt_sideDone('k2_kantine', 'Joghurt-Streit, Siegelregeln – und sie haben Kinder ausgelost. „Ohne Liste nimmt sie, wen sie will.“'); } }); }
async function amt_kaffeeSchreck() { const S = amt_S; if (S.kaffeeLief) return; S.kaffeeLief = true; const x = C2.x + 6.45, z = C2.z + 2.6;
  try { Audio.play('waterFlow', { gain: .25, rate: 1.4, dur: 3.5, lp: 1500, x, y: 1.1, z, ref: 2 }); Audio.play('machine1', { gain: .2, rate: 1.8, dur: 3.2, x, y: 1.1, z, ref: 2 }); } catch (e) {}
  if (S.kaffeeDisp) S.kaffeeDisp.material.emissiveIntensity = 1.4; await wait(3600); if (S.kaffeeDisp) { for (let i = 0; i < 6; i++) { S.kaffeeDisp.material.emissiveIntensity = i % 2 ? 1.4 : .2; await wait(260); } }
  say([['Seit Jahren will die entkalkt werden. Mehr Durchhaltevermögen als ich.', 4000, 'LUKE']]); }
function amt_kaffeekasse() { const S = amt_S; if (S.kasse) return toast('Die Kaffeekasse. Ein Euro liegt darin. Deiner.', 2600);
  if (!story.items.includes('euro_bruno')) return toast('Eine Blechdose, KAFFEEKASSE. Leer bis auf einen Knopf. Ein Zettel: „Bitte zahlen. Wir führen Buch.“', 3800);
  S.kasse = true; story.items = story.items.filter(k => k !== 'euro_bruno'); Audio.play('keys2', { gain: .3, rate: 1.6, x: C2.x + 6.4, y: 1, z: C2.z + 3.55, ref: 2 }); amt_trust('kaffeekasse');
  amt_lore('amt_kaffeekasse', 'Kaffeekasse Ebene −2: 1 €', 'Ein Euro in die Kaffeekasse. Pfandgeld von Bruno.'); questPop('FIBEL', 'Kaffeekasse Ebene −2: 1 €'); say([['Die merken sich alles. Dann sollen sie das auch merken.', 3400, 'LUKE']]); }
function amt_ascher() { const S = amt_S; toast('Kippen. Filter mit Lippenstift, Filter ohne. Ein Kaugummipapier mit dem Zeichen – dieselbe Sorte wie an der Südsperre.', 4600);
  if (!S.said.ascher) { S.said.ascher = 1; setTimeout(() => say([['Und einer, der keine Zigarette war. Im Amt. Nachtschicht ist Nachtschicht.', 3800, 'LUKE']]), 1800); } }
// „Einmachen“: Kühlregal nach dem Notstrom; beim Schließen beschlägt die Scheibe – drei Punkte, von innen geschrieben
function amt_kuehlregal() { const S = amt_S; amt_side('k2_einmachen');
  if (!ch2.power) return toast('Ein Magnetschloss. Ohne Strom rührt sich nichts. Durch das Glas: leere Fächer mit Etiketten.', 3800);
  const html = 'Die Glastür schnappt auf, Kälte kommt dir entgegen. Leere Fächer mit Etiketten:\n\n„<b>∴-1</b> – verlegt Villa“ (leer, ein Ring aus altem Reif)\n„<b>∴-2</b> – verlegt Villa“ (leer)\n„<b>∴-3</b>“, durchgestrichen, darunter: „nicht fixierbar“\n„Substanz S · Charge 92/3 · Verwendung: K-1“ (ein Fleck)\n„Substanz S · Ration · monatlich · Empfänger geschwärzt“ (ein sauberer Kreis im Staub – vor kurzem hat jemand etwas herausgenommen)\n\nUnterstes Etikett: „Privat. Nicht anfassen. N. 12.“ Darin: eine Dose Kassler.';
  amt_note('Kühlregal · Substanz S', html, 'kuehlregal', () => { if (S.kuehl) return; S.kuehl = true;
    try { if (typeof beobachter_zettel === 'function') beobachter_zettel('B-K2-06', { pos: [C2.x + 35.3, 1.02, C2.z + 3.55] }); } catch (e) {}
    amt_trust('kuehlregal'); amt_lore('amt_drei', '∴ sind drei', 'Kühlregal Substanz S: ∴-1 und ∴-2 „verlegt Villa“, ∴-3 durchgestrichen, „nicht fixierbar“. Dazu eine monatliche Ration für H. W.');
    setTimeout(() => say([['Drei Punkte. Drei Fächer. Zwei leer, eins durchgestrichen. Ich will nicht wissen, was da drin war. Ich will es wirklich nicht.', 5600, 'LUKE']]), 800);
    setTimeout(() => { Audio.play('metalOpen', { gain: .4, rate: 1.3, x: C2.x + 35.3, y: 1, z: C2.z + 3.55, ref: 2 }); try { Audio.play('machine1', { gain: .3, dur: 2.4, lp: 600, x: C2.x + 35.3, y: 1.1, z: C2.z + 3.55, ref: 2 }); } catch (e) {} S.beschlagT = 0; S.beschlagAn = true;
      setTimeout(() => { Audio.play('metalHit1', { gain: .12, rate: 1.9, x: C2.x + 35.6, y: 2, z: C2.z + 3.2, ref: 2 }); }, 3200); amt_sideDone('k2_einmachen', '∴ sind drei. Zwei davon in Glas, verlegt in die Villa. Das dritte schreibt Zettel.'); }, 7200); }); }
// „Eins zu siebenundachtzig“: Ochs am Berg umgedreht (Story-Prüfung G-1) – die Luke-Figur rückt nur, WÄHREND Luke hinsieht, langsam wie ein Uhrzeiger, je Hinsehen einen Raum näher; beim sechsten fällt sie neben dem Tank um
function amt_modell() { const S = amt_S; amt_side('k2_modell'); if (!S.said.modell) { S.said.modell = 1; say([['Eins zu siebenundachtzig. Irgendwer hier unten hatte ein Hobby.', 3600, 'LUKE']]); }
  amt_note('Das Modelldorf', 'Lost Eyengless in Modellbahngröße: Ahornstraße, Kapelle, Tankstelle, der Hof. Die Senke ist ein schwarzes Loch mit einer Pappkuppel: „OBJEKT“. Nummer 3 hat ein Dach aus Alufolie. An der Modell-Tankstelle ein Pappschild: „Pfand hier abgeben“.\n\nFiguren: Eine Frau hängt an einem Faden über der Kreuzung. Eine winzige weiße Figur am Rand der Senke, ein Zettel: „DREIPUNKT · Standort?“ Eine graue, unbemalte Figur am Rand, in den Sockel geritzt: „EISEN“.\n\nUnd vorn, im Schnitt durch die Ebene −2, ein Junge im gestreiften Hemd, mit einer Lampe.', 'modelldorf', () => { if (!S.said.pfandM) { S.said.pfandM = 1; setTimeout(() => subtitle('Sogar im Modell nimmt Vegas Pfand.', 3000, 'LUKE'), 600); } }); }
function amt_modellLuke(n) { const S = amt_S; if (!S.lukeFig || !S.lukeWeg) return; const cx = C2.x + 34, cz = C2.z + 11.2, W = S.lukeWeg, i = Math.min(Math.floor(n), W.length - 1), j = Math.min(i + 1, W.length - 1), f = n - Math.floor(n);
  const px = W[i][0] + (W[j][0] - W[i][0]) * f, pz = W[i][1] + (W[j][1] - W[i][1]) * f;
  S.lukeFig.position.set(cx - px, (S.modellY || .76) + .02, cz - pz + .1); S.lukeFig.rotation.set(n >= 6 ? -PI / 2 : 0, 0, 0); if (n >= 6) S.lukeFig.position.y = (S.modellY || .76) + .006; }
function amt_modellTick(dt = .016) { const S = amt_S; if (!S.lukeFig || (S.modellP != null ? S.modellP >= 6 : S.modellN >= 6) || !amt_in(C2.x + 30.2, C2.x + 37.8, C2.z + 8.2, C2.z + 13.8) || !S.said.modell) return;
  camera.getWorldDirection(_amtV); const dx = C2.x + 34 - camera.position.x, dz = C2.z + 11.2 - camera.position.z, d = Math.hypot(dx, dz) || 1, dot = (_amtV.x * dx + _amtV.z * dz) / d;
  if (S.modellP == null) S.modellP = S.modellN || 0;
  if (typeof ui !== 'undefined' && ui.overlay) { S.modellBlick = false; return; } // beim Lesen sieht er nicht hin
  if (dot < .5) { S.modellBlick = false; return; } // weggesehen: sie steht
  if (dot < .8) return;
  if (!S.modellBlick) { S.modellBlick = true; if (S.modellP >= (S.modellN || 0) - .001) { S.modellN = Math.min(6, (S.modellN || 0) + 1); S.modellHin = (S.modellHin || 0) + 1;
      Audio.play('woodHit1', { gain: .025, rate: 3.1, x: C2.x + 34, y: .8, z: C2.z + 11.2, ref: 1.5 });
      if (S.modellHin === 2) say([['Die bewegt sich, weil ich gucke.', 2600, 'LUKE'], ['… Das ist schlimmer.', 2600, 'LUKE']]); } }
  if (S.modellP < S.modellN) { S.modellP = Math.min(S.modellN, S.modellP + dt * .28); amt_modellLuke(Math.min(S.modellP, 5.999));
    if (S.modellP >= 6) { amt_modellLuke(6); Audio.play('woodHit1', { gain: .06, rate: 2.2, x: C2.x + 34, y: .8, z: C2.z + 11.2, ref: 1.5 }); try { Audio.stinger(false); } catch (e) {} shake = Math.max(shake, .02);
      setTimeout(() => toast('Die Figur kippt neben dem Tank um. Gesicht nach unten.', 3600), 400); amt_sideDone('k2_modell', 'Die LWO hat eine Figur für alle. Und meine bewegt sich nur, wenn ich hinsehe.'); } } }
function amt_reim() { amt_lore('amt_abzaehlreim', 'Der ältere Abzählreim', '„Eins, zwei, drei, vier, fünf, sechs, sieben, / eins von uns ist drin geblieben, / acht ist keins und neun ist keins, / dreh dich um, dann bist du meins.“');
  amt_note('In die Tischkante geritzt', 'Kinderschrift, mit etwas Spitzem ins Holz:\n\n<span class="hand">„Eins, zwei, drei, vier, fünf, sechs, sieben,\neins von uns ist drin geblieben,\nacht ist keins und neun ist keins,\ndreh dich um, dann bist du meins.“</span>', null); }
function amt_karteiK() { amt_note('Karteikasten „VERSUCHSREIHE K“', '<span style="font-family:\'Courier New\',monospace;font-size:.92em;line-height:1.5"><b>K-1 · Kranz, Peter · Rückläufer 1975 · aufgenommen 11/1992.</b> Ziel: Rückführung des Originals aus der Kopie (Substanz S, Charge 92/3). Ergebnis: Kopie nimmt die Form an, die ein Kind (Nichte, 9) von ihm im Gedächtnis hatte: „der lachende Onkel“. Gebiss abweichend. Schmerzempfinden: vollständig. Erkenntnis: vollständig. Original: nicht erschienen. Ausbruch 2011, zwei Pfleger. Rückgeführt. Käfig.<br><br><b>K-2 · Hinweis.</b> Junge, ohne Namen, Rückläufer 1958. Substanz S, erste Charge. Verstorben 1961. Grabstelle 08, „Unbekanntes Kind“. Akte in Villa S.<br><br><b>K-3 · vorgesehen.</b> Name: ———. Aufnahme nach Öffnung 2026. Bemerkung (hw): „Wenn es gelingt, bekommen wir sie alle zurück. Auch die von 1941.“</span>', 'versuchsreihe_k',
  () => { if (!amt_S.said.k3) { amt_S.said.k3 = 1; setTimeout(() => say([['K-3. Vorgesehen. Wer ist noch so blöd und kommt hierher?', 3600, 'LUKE']]), 500); } }); }
// Stuhl 8: durchtrennte Gurte, die Kerbe, die Feder (W-05)
function amt_stuhl8() { const S = amt_S; const erst = !S.stuhl8; S.stuhl8 = true; if (S.feder) S.feder.visible = true;
  amt_note('Stuhl 8', 'Kein Namensschild. Die Gurte sind durchtrennt, sauber. In der Lehne eine Kerbe, zwei Finger breit, durch das Metall des Riemens bis ins Holz.\n\nIn der Kerbe klemmt eine schwarze Feder. Alt, breit. Keine Krähenfeder. Als hätte der Schlag sie irgendwo abgerissen.', 'stuhl8', () => {
    if (!erst) return; amt_lore('amt_feder', 'Die Feder in der Kerbe', 'Stuhl 8 im Messraum: eine schwarze Feder in der Kerbe, alt, breit. Der Rabe geht nicht unter die Erde.');
    say([['Eine Rabenfeder. Hier unten. Der Vogel geht nicht unter die Erde, das hab ich gesehen. Wer hat die hier reingetragen?', 5400, 'LUKE']]); }); }
// UK8 nach Akte 08: der Umschlag, die Uhr, genau ein Satz, der Zettel auf dem Klavierdeckel, dann Lucy
async function amt_akte08() { const S = amt_S; if (S.akte8) return; S.akte8 = true; amt_uhr(3, 11);
  setTimeout(() => amt_druck('VORGANG 08 · KORREKTUR: RÜCKLÄUFER 08.', { mess: !!S.messDruck, immer: true }), 2600); // W-1: der Drucker rattert einmal, ohne dass Luke sich bewegt
  if (!story.items.includes('umschlag7')) { addItem('umschlag7'); S.umschlag = true; }
  try { if (typeof AKTE_S !== 'undefined') { const d = AKTE_S.docs.find(q => q.n === 7); if (d) { d.m.visible = false; uninteract(d.hit); d.weg = true; } } } catch (e) {}
  try { if (typeof sammeln_fibel === 'function') { sammeln_fibel('D-03'); sammeln_fibel('D-05'); } } catch (e) {} // in der Fibel werden zwei Gedanken durchgestrichen (Augen, Hund)
  await wait(10000); await say([['Ich hab nie gewusst, wie der Hund hieß.', 3400, 'LUKE']]);
  try { if (typeof beobachter_zettel === 'function') beobachter_zettel('B-K2-07', { pos: [C2.x + 110, 1.04, C2.z + 7.35], gitter: true }); } catch (e) {}
  await wait(7000); while (ui.overlay || state.talking) await wait(300); finale(); }
// X-7: Zeichen – ∴ klein in den Putz geritzt (Tunnel, neben den Kratzern; Durchgang über der Tür von Zimmer 7), nur im Streiflicht der Lampe deutlich
function amt_zeichen() { const c = amt_cv(128, 64, (x, w, h) => { x.clearRect(0, 0, w, h); for (const [px, py] of [[64, 16], [40, 48], [88, 48]]) { x.fillStyle = 'rgba(25,22,18,.7)'; x.beginPath(); x.arc(px, py, 7, 0, 7); x.fill(); x.fillStyle = 'rgba(215,208,190,.35)'; x.beginPath(); x.arc(px - 2, py - 2, 3, 0, 7); x.fill(); } });
  const m = amt_decal(c, { rough: .95 }); amt_flaeche(m, C2.x + 16.05, .52, C2.z - 1.84, .07, .035, 0); amt_flaeche(m, C2.x + 34.3, 2.32, C2.z - 1.84, .06, .03, 0); }
// Plastikarmband „KRANZ, P.“ am linken Handgelenk der Peter-Figur (feuer.js lädt sie): angeschmolzenes Krankenhausband mit Etikett und Tropfen
function amt_armband(S) { S.armband = true;
  try { const h = PZ.ue.hand_l, ws = new THREE.Vector3(); h.updateWorldMatrix(true, false); h.getWorldScale(ws); const k = 1 / (ws.x || 1), ch = h.children.find(c => c.isBone && c.position.lengthSq() > 0), dir = ch ? ch.position.clone().normalize() : new THREE.Vector3(0, 1, 0);
    const mat = new THREE.MeshStandardMaterial({ roughness: .4, side: THREE.DoubleSide, map: amt_tex(amt_cv(1024, 72, (x, w, h2) => { const g = x.createLinearGradient(0, 0, 0, h2); g.addColorStop(0, '#ddd8c4'); g.addColorStop(1, '#bdb69a'); x.fillStyle = g; x.fillRect(0, 0, w, h2); x.fillStyle = 'rgba(70,40,20,.35)'; x.fillRect(0, h2 - 12, w, 12);
        for (let r = 0; r < 2; r++) { x.fillStyle = '#1d2a4a'; x.font = 'bold 40px "Courier New", monospace'; x.fillText('KRANZ, P.  K-1 · 1992', 20 + r * 512, 46); }
        for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(30,18,10,${amt_R(.1, .5)})`; x.beginPath(); x.arc(amt_R(0, w), amt_R(h2 * .5, h2), amt_R(1, 5), 0, 7); x.fill(); } })) });
    const g = new THREE.Group(), band = new THREE.Mesh(new THREE.CylinderGeometry(.037, .037, .017, 30, 1, true), mat); g.add(band);
    const tag = new THREE.Mesh(new THREE.BoxGeometry(.05, .004, .028), new THREE.MeshStandardMaterial({ color: 0xe6e1cd, roughness: .5 })); tag.position.set(0, .0395, 0); g.add(tag);
    const drip = new THREE.MeshStandardMaterial({ color: 0xb9b196, roughness: .35 }); for (const [a, r] of [[.6, .004], [2.4, .0055], [4.1, .0035]]) { const d = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), drip); d.scale.set(1, 1.7, 1); d.position.set(Math.cos(a) * .0375, -.012 - r, Math.sin(a) * .0375); g.add(d); }
    g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.userData.noCol = true; } });
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); g.scale.setScalar(k); g.position.copy(dir).multiplyScalar(-.02 * k); h.add(g); S.armbandObj = g;
  } catch (e) { console.warn('amt: Armband', e); } }
function amt_nachLaden() { const S = amt_S; if (!S.ready) return;
  if (S.tuer.reg) S.tuer.reg.locked = !S.reg; if (S.leiter && S.leiterSich) { S.leiterSich.visible = false; uninteract(S.leiterHit); } if (S.leiterSteht && S.leiterArchiv && !S.gruendung) S.leiterArchiv.visible = true;
  if (S.gruendung && S.gruendDeckel) S.gruendDeckel.visible = false; if (S.gruendung) amt_sprosse(); if (S.vernichter && S.streifen) S.streifen.visible = false;
  if (S.regFotos && S.regFotoMesh) S.regFotoMesh.forEach((m, i) => m.visible = i < S.regFotos); if (S.regDreh && S.regFotoMesh) S.regFotoMesh[0].material = S.regBack;
  if (S.batt === true) (S.battObj || []).forEach(g => g.visible = false); S.modellP = null; amt_modellLuke(S.modellN || 0); if (S.stuhl8 && S.feder) S.feder.visible = true; if (S.said.kschub && S.kschubBatt) S.kschubBatt.visible = false; amt_papierNeu(); }

// UK8: Klavier – sobald Luke die Tasten berührt, summt Lucy im Tank; die Tasten, die sie trifft, beschlagen (E D C H C). Nach 3 Fehlern langsamer, nach 6 bleibt der Beschlag.
function amt_klavier(box) { const S = amt_S, fehl = S.klavierFehl || 0, lang = fehl >= 3 ? 1.6 : 1, bleibt = fehl >= 6, TK = { x: C2.x + 118, z: C2.z + 6 };
  amt_summen(TK.x, 1.4, TK.z, .06, 1 / lang); const seq = ['E', 'D', 'C', 'H', 'C']; let i = 0;
  const btn = k => box.querySelector(`.pk[data-k="${k}"]`); box.querySelectorAll('.pk').forEach(b => { b.style.transition = 'background .5s, box-shadow .5s'; });
  const nebel = () => { if (!box.isConnected) return; const b = btn(seq[i]); if (b) { b.style.background = 'linear-gradient(#f4f6f4, #c9d2d2)'; b.style.boxShadow = 'inset 0 0 18px rgba(255,255,255,.95), 0 0 10px rgba(200,220,220,.4)'; if (!bleibt) setTimeout(() => { b.style.background = ''; b.style.boxShadow = ''; }, 900 * lang); }
    i++; if (i < seq.length) setTimeout(nebel, 700 * lang); };
  setTimeout(nebel, 600); }
function amt_klavierFalsch() { const S = amt_S; S.klavierFehl = (S.klavierFehl || 0) + 1; try { Audio.pianoNote('F', C2.x + 111.8, 1, C2.z + 7.5); setTimeout(() => Audio.pianoNote('H', C2.x + 111.8, 1, C2.z + 7.5), 60); } catch (e) {}
  if (typeof lenaFig !== 'undefined') { S.lucyWeg = 3.5; } }
// B-K2-04: nach der Rauchflucht auf der Schwelle, ein Eukalyptusbonbon obendrauf – wer es isst, hat fünf Sekunden eine ruhigere Kamera
function amt_safe() { try { if (typeof beobachter_zettel === 'function') beobachter_zettel('B-K2-07', { pos: [C2.x + 111.85, 1.29, C2.z + 7.62], gitter: true }); } catch (e) {} } // aus dem Gitter über dem Klavier, auf den Deckel
function amt_danke() { const S = amt_S; if (S.danke) return; S.danke = true; const x = C2.x + 106.75, z = C2.z + .15;
  let ok = false; try { if (typeof beobachter_zettel === 'function') ok = beobachter_zettel('B-K2-04', { pos: [x, 0, z] }); } catch (e) {}
  const bb = amt_decal(amt_cv(64, 64, (c, w) => { c.clearRect(0, 0, w, w); c.translate(32, 32); c.rotate(.4); c.fillStyle = '#e9f0e6'; c.fillRect(-14, -9, 28, 18); c.fillStyle = '#1f7a4a'; c.fillRect(-14, -3, 28, 6); c.beginPath(); c.moveTo(-14, -9); c.lineTo(-24, -14); c.lineTo(-24, 14); c.lineTo(-14, 9); c.fill(); c.beginPath(); c.moveTo(14, -9); c.lineTo(24, -14); c.lineTo(24, 14); c.lineTo(14, 9); c.fill(); }));
  S.bonbon = amt_boden(bb, x + .12, z + .1, .06, .06, .3, .02); S.bonbonHit = amt_hit(x + .12, .05, z + .1, .25, .12, .25, 'Das Bonbon essen', () => { uninteract(S.bonbonHit); S.bonbon.visible = false; S.ruhig = 5; try { Audio.paper(); } catch (e) {} });
  void ok; }
// UK9-Vorlauf und Messraum-Eintritt
function amt_messraumTick(dt) { const S = amt_S, P = player.pos, X0 = C2.x, Z0 = C2.z;
  if (!S.messIn && P.x > X0 + 110.4 && ch2.chase === 'done') { S.messIn = true; amt_uhr(2, 58);
    if (S.messDruckObj) S.messDruckObj.visible = true; setTimeout(() => amt_druck('RÜCKLÄUFER 08 MESSRAUM. PROTOKOLL 08 WIRD FORTGESETZT.', { mess: true }), 1200);
    setTimeout(() => amt_band('Willkommen zurück.', { kichern: true }), 6200); }
  if (S.messIn && !S.lucyDa && !state.talking && Math.hypot(P.x - (X0 + 118), P.z - (Z0 + 6)) < 2.4) { S.lucyDa = true; say([['Lucy.', 1600, 'LUKE']]);
    S.tankHit = amt_hit(X0 + 117.35, 1.3, Z0 + 5.35, .45, 1.0, .3, 'Die Hand ans Glas legen', () => { uninteract(S.tankHit); S.tankHand = true; subtitle('Sie atmet. Das Wasser ist warm.', 3600); }); }
  if (S.lucyWeg > 0 && typeof lenaFig !== 'undefined') { S.lucyWeg -= dt; const w = S.lucyWeg > 1 ? 1 : Math.max(0, S.lucyWeg); lenaFig.rotation.y += ((lenaFig.userData.ry0 ?? lenaFig.rotation.y) + 1.1 * w - lenaFig.rotation.y) * Math.min(1, dt * 3); if (lenaFig.userData.ry0 === undefined) lenaFig.userData.ry0 = lenaFig.rotation.y; } }
// Tunnel und Archiv: Band, Druck, Summen, Uhrensprung
function amt_regieTick(dt) { const S = amt_S, P = player.pos, X0 = C2.x, Z0 = C2.z, s = S.schritt;
  if (typeof uebergang3_S !== 'undefined' && uebergang3_S.phase) return; // nach dem Abspann (UK 9): keine Bänder und Drucker mehr
  if (!s.tunnel && P.x > X0 + 1 && P.x < X0 + 18) { s.tunnel = S.t; amt_uhr(1, 6, false); }
  if (s.tunnel && !s.druck1 && S.t - s.tunnel > 3) { s.druck1 = 1; amt_druck('RÜCKLÄUFER 08 BETRITT EBENE −2.'); }
  if (s.tunnel && !s.band1 && S.t - s.tunnel > 8.5 && !state.talking) { s.band1 = 1; (async () => { await amt_band('Guten Tag. Sie befinden sich in der Außenstelle Lost Eyengless der Bundesstelle für Rückführung. Bitte halten Sie Ihre Einwilligung bereit. Begleitpersonen warten im Wartebereich.');
      await wait(900); await amt_band('', { schnitte: ['Bitte …', 'nicht …', 'rennen.', 'Bitte …', 'nicht …', 'gucken.'], kichern: true, spieluhr: true }); await wait(900);
      gedanke('amt_geschnitten', 'Das ist geschnitten. Jedes Wort aus einem anderen Raum. Wer klebt so was zusammen?', 0, 3); s.summT = S.t + 9; })(); }
  if (s.summT && !s.summ && S.t > s.summT && !state.talking) { s.summ = 1; amt_summen(X0 + 70, -2, Z0, .05, .9); setTimeout(() => { try { Audio.duck && Audio.duck(3); } catch (e) {} }, 1500);
    setTimeout(() => say([['Keine Spieluhr darunter. Das ist sie. Das ist Lucy.', 3600, 'LUKE']]), 6800); }
  // Bahnhofsuhr im Tunnel: springt zweimal, während Luke hinsieht
  if (S.uhren && !s.uhrSprung && s.tunnel && amt_nah(S.uhren[0].x, S.uhren[0].z, 9)) { camera.getWorldDirection(_amtV); const U = S.uhren[0], dx = U.x - camera.position.x, dy = U.y - camera.position.y, dz = U.z - camera.position.z, d = Math.hypot(dx, dy, dz) || 1;
    if ((_amtV.x * dx + _amtV.y * dy + _amtV.z * dz) / d > .95) { s.uhrSprung = 1; amt_uhr(1, 7); setTimeout(() => amt_uhr(1, 8), 700); } }
  if (!s.archiv && P.x > X0 + 18.5) { s.archiv = S.t; amt_uhr(1, 19); amt_druck('RÜCKLÄUFER 08 BETRITT ARCHIV.'); }
  if (s.archiv && !s.band2 && S.t - s.archiv > 9 && !state.talking) { s.band2 = 1; amt_band('Die Nachuntersuchung dauert wenige Minuten. Ihr Kind wird gewogen, gemessen und angehört. Es besteht kein Anlass zur Sorge.'); }
  if (S.nr && s.archiv && !s.band8 && S.t - s.archiv > 70 && !state.talking && !ui.overlay) { s.band8 = 1; amt_band('Wer seine Nummer nicht kennt, wartet bitte, bis er aufgerufen wird. Acht.'); }
  if (!s.kantine && amt_in(X0 + 6.2, X0 + 17.8, Z0 + 2.2, Z0 + 7.8)) { s.kantine = 1; amt_side('k2_kantine'); setTimeout(() => amt_band('Die Kantine bittet um Verständnis.'), 1500); }
  if (!s.plan && amt_in(X0 + 30.2, X0 + 37.8, Z0 + 8.2, Z0 + 13.8)) { s.plan = 1; amt_side('k2_modell'); }
  if (!ch2.ag06 && !ch2.power && amt_in(X0 + 30.3, X0 + 35.7, Z0 + 2.4, Z0 + 7.7)) { s.sichT = (s.sichT || 0) + dt; if (s.sichT > 2.2 && !state.talking && !ui.overlay) amt_ag06(); }
  if (!s.pruef && ch2.power && P.x > X0 + 36.4 && P.x < X0 + 46) { s.pruef = 1; amt_uhr(2, 26); amt_druck('RÜCKLÄUFER 08 BETRITT PRÜFRAUM 3.'); }
  if (!s.gang && ch2.chase === 'run') { s.gang = 1; amt_uhr(2, 41); amt_druck('RÜCKLÄUFER 08 GANG. K-1 FREI.', { still: true }); }
  if (ch2.spiderPhase === 'gone' && !S.spinnenT) S.spinnenT = S.t;
  // Beobachter-Zettel mit festem Ort (AP-07-Schnittstelle): B-K2-02 liegt auf dem Nadeldrucker, wenn Luke von der Tafel zurückkommt; B-K2-05 liegt schon im Versteck hinter den Schränken
  if (ch2.archiveSolved && !s.archSolvedT) s.archSolvedT = S.t;
  if (s.archSolvedT && !s.bk202 && S.t - s.archSolvedT > 6 && !amt_nah(AMT_DRUCK.x, AMT_DRUCK.z, 3.5)) { s.bk202 = 1; try { if (typeof beobachter_zettel === 'function') beobachter_zettel('B-K2-02', { pos: [AMT_DRUCK.x + .02, AMT_DRUCK.y + .2, AMT_DRUCK.z] }); } catch (e) {} }
  if (s.archSolvedT && !s.bk205 && S.t - s.archSolvedT > 20) { s.bk205 = 1; try { if (typeof beobachter_zettel === 'function') beobachter_zettel('B-K2-05', { pos: [X0 + 108.7, 0, Z0 + 6.6] }); } catch (e) {} }
  // Registratur: die Fotos liegen nebeneinander – wer weggeht und wiederkommt, findet das von 1958 mit dem Gesicht nach unten
  if (S.regDrehen && !S.regDreh) { const drin = amt_in(X0 + 6.2, X0 + 17.8, Z0 - 7.8, Z0 - 2.2); if (!drin) S.regDraussen = true; else if (S.regDraussen) { S.regDreh = true; if (S.regFotoMesh) S.regFotoMesh[0].material = S.regBack; try { const q = S.regFotoMesh && S.regFotoMesh[0].position; if (q && Audio.ctx) { const pd = Audio.at(q.x, q.y, q.z, 1); if (!Audio.cut) for (let i = 0; i < 4; i++) { const n = Audio.noise(false), bp = Audio.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(2000, 5000); bp.Q.value = 3; n.connect(bp); Audio.env(bp, .12, .01, .05, i * .05, pd); n.stop(Audio.ctx.currentTime + .5); } } else Audio.paper(); } catch (e) {} } } }
// Notbeleuchtung (nach dem Finale) und die Mond-/Laternenleuchte im Schacht werden hier gestellt (Intensität; die Lichter gibt es seit dem Laden)
function amt_lichtTick(dt) { const S = amt_S;
  // Kinosequenz „Ihre Augen“ (Wunsch AP-10): nach dem Sterben der Röhren brennen die Batterie-Notleuchten; im Schacht fällt Mondlicht durch den Gully
  const kid = typeof kino_S !== 'undefined' && kino_S.on ? kino_S.id : null; if (kid === 'k2') { S.notlichtAn = 1; S.kinoMond = 1; } else if (S.kinoMond && !kid) { S.kinoMond = 0; }
  if (typeof uebergang3_S !== 'undefined' && uebergang3_S.mond && (S.kinoMond || S.kinoMondWar)) { const u = uebergang3_S; if (S.kinoMond) { u.mond.intensity = 1.1; u.mond2.intensity = .8; S.kinoMondWar = 1; } else if (!u.phase || u.phase === 'lampe') { u.mond.intensity = 0; u.mond2.intensity = 0; S.kinoMondWar = 0; } }
  const an = S.notlichtAn; if (S.notlicht) for (const N of S.notlicht) { const w = an ? .9 + .1 * Math.sin(S.t * 2.1) : 0; N.l.intensity = w * 1.7; N.m.material.emissiveIntensity = an ? 1.2 : 0; }
  if (S.beschlagAn && S.kuehlBeschlag) { S.beschlagT += dt; S.kuehlBeschlag.material.opacity = Math.min(.95, S.beschlagT / 1.6) * (S.beschlagT > 40 ? Math.max(0, 1 - (S.beschlagT - 40) / 20) : 1); if (S.beschlagT > 60) S.beschlagAn = false; }
  if (S.tafelGlow && typeof innen_kapitel_S !== 'undefined' && innen_kapitel_S.pruefTafel) { S.tafelGlow = Math.max(0, S.tafelGlow - dt * .06); innen_kapitel_S.pruefTafel.material.emissiveIntensity = .55 * S.tafelGlow; } }
// =====================================================================  PRO BILD (keine Allokationen)
WORLD_TICK.push((dt, t) => {
  const S = amt_S; if (!S.ready) return; try {
    S.t += dt;
    if (S.q.length && S.druckT <= 0 && (!ch2.on ? (S.q.length = 0, false) : true)) { const [txt, o] = S.q.shift(); amt_druckJetzt(txt, o); }
    if (S.druckT > 0) S.druckT -= dt;
    if (S.ruhig > 0) { S.ruhig -= dt; shake = 0; if (typeof fear !== 'undefined' && fear.v > .2) fear.v *= .96; }
    amt_lichtTick(dt);
    if (!ch2.on) return;
    if (!S.armband && typeof PZ !== 'undefined' && PZ.P && PZ.ue && PZ.ue.hand_l) amt_armband(S);
    if (S.planTube) S.planTube.mode = ch2.power ? (S.planTube.mode === 'off' ? 'flicker' : S.planTube.mode) : 'off';
    amt_regieTick(dt); amt_k1Tick(dt); amt_modellTick(dt); amt_messraumTick(dt);
    if (typeof feuer_S !== 'undefined' && feuer_S.done && !S.danke && player.pos.x > C2.x + 106.4) amt_danke();
    // Bis AG-07 vorbei ist, bleibt die Messraumtür zu (dahinter rasseln Ketten, grelles Licht): unsichtbare Sperre im Türspalt der Trennwand
    { const sperr = typeof feuer_S !== 'undefined' && feuer_S.done && !S.ag07; if (sperr && !S.vorSperre) S.vorSperre = addCol(C2.x + 109.8, C2.x + 110.2, C2.z - .8, C2.z + .8, 3); if (S.vorSperre) { if (!sperr) { S.vorSperre.minX = S.vorSperre.maxX = -9999; S.vorSperre = null; } else if (!S.said.vorSperre && amt_nah(C2.x + 109.6, C2.z, 1.1)) { S.said.vorSperre = 1; subtitle('Da drin rasselt etwas. Ketten. Und Licht, zu grell für diese Nacht.', 3600); } } }
  } catch (e) { if (!S.err) { S.err = true; console.warn('Amt-Tick', e); } }
});
window.__amt = { S: amt_S, druck: (t, o) => amt_druck(t, o || {}), band: (t, o) => amt_band(t, o || {}), notstrom: () => amt_notstrom(), ag06: () => amt_ag06(), nummer: () => amt_nummer(), akte08: () => amt_akte08(), stuhl8: () => amt_stuhl8(), uhr: (h, m) => amt_uhr(h, m), summen: () => amt_summen(C2.x + 20, 1, C2.z, .08), ag07: () => lwo_ag07(), ag07S: () => LWO_AG07, lampe: on => { flashOn = !!on; } };
// Akte 08: angeheftetes Foto – ein Junge mit braunen Augen, verschlafen, auf seiner Schulter ein Handschuh aus mattgrauem Metall, das nicht wie Eisen aussieht
function amt_akte08Foto() { const S = amt_S; if (!S.foto08) S.foto08 = amt_cv(400, 300, (x, w, h) => { amt_rs = 808; x.fillStyle = '#6a6458'; x.fillRect(0, 0, w, h); const g = x.createRadialGradient(170, 130, 10, 170, 150, 220); g.addColorStop(0, 'rgba(220,200,170,.5)'); g.addColorStop(1, 'rgba(20,20,20,.6)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.filter = 'blur(1.4px)'; x.fillStyle = '#c9a888'; x.beginPath(); x.ellipse(170, 130, 52, 64, 0, 0, 7); x.fill(); x.fillStyle = '#3a2a1c'; x.beginPath(); x.ellipse(170, 84, 58, 30, 0, PI, 7); x.fill();
    x.fillStyle = '#4a3020'; for (const ex of [150, 192]) { x.beginPath(); x.ellipse(ex, 128, 7, 4, 0, 0, 7); x.fill(); } x.strokeStyle = 'rgba(90,60,50,.5)'; x.lineWidth = 2; for (const ex of [150, 192]) { x.beginPath(); x.arc(ex, 124, 9, .2, 2.9); x.stroke(); }
    x.fillStyle = '#3b4a5a'; x.fillRect(96, 190, 150, 110); x.fillStyle = '#8c9296'; x.beginPath(); x.moveTo(236, 186); x.quadraticCurveTo(300, 170, 330, 200); x.lineTo(320, 236); x.quadraticCurveTo(270, 230, 236, 226); x.fill();
    x.strokeStyle = 'rgba(40,44,48,.7)'; x.lineWidth = 3; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(250 + i * 16, 190); x.lineTo(246 + i * 16, 222); x.stroke(); } x.filter = 'none';
    for (let k = 0; k < 7000; k++) { const v = amt_R(0, 255) | 0; x.fillStyle = `rgba(${v},${v},${v},.05)`; x.fillRect(amt_R(0, w), amt_R(0, h), 1.3, 1.3); } x.strokeStyle = '#eee9dc'; x.lineWidth = 14; x.strokeRect(0, 0, w, h); });
  return `\n\n<img src="${S.foto08.toDataURL('image/jpeg', .85)}" style="display:block;width:70%;margin:8px auto;transform:rotate(-1.4deg);box-shadow:0 3px 10px rgba(0,0,0,.5)"><small>Angeheftet: ein Junge mit braunen Augen, verschlafen. Auf seiner Schulter ein Handschuh aus mattgrauem Metall, das nicht wie Eisen aussieht.</small>`; }
// Nachbild am Stuhlkreis (Besetzung) und Lukes Gedanke danach (Wortlaut Kap. 2, UK 8)
if (typeof FIGUREN_ECHO !== 'undefined') FIGUREN_ECHO.echo_messraum = ['lucy', 'mike', 'dina', 'heidi', 'luke', 'justin', 'amt1'];
if (typeof GEDANKEN_ECHO !== 'undefined') { GEDANKEN_ECHO.echo_messraum = 'Ein Ritter. Am Straßenende hat er einen Namen in den Nebel gerufen. Und hier hat er geweint.'; delete GEDANKEN_ECHO.echo_archiv; }
// Weiterspielen: Regie-Schritte hinter dem Speicherpunkt nicht wiederholen
CH2_BEGIN.push(() => setTimeout(() => { const S = amt_S, s = S.schritt, P = player.pos, X0 = C2.x; if (P.x > X0 + 17) Object.assign(s, { tunnel: -1e9, druck1: 1, band1: 1, summ: 1, uhrSprung: 1 }); if (P.x > X0 + 19 || ch2.archiveSolved) Object.assign(s, { archiv: -1e9, band2: 1, band8: 1 });
  if (ch2.power) { S.uhrMin = Math.max(S.uhrMin || 0, 130); amt_uhrStellen(); } if (ch2.spiderPhase === 'gone') { s.pruef = 1; S.k1.gang = S.k1.tuer = S.k1.still = 1; } if (ch2.chase === 'done') s.gang = 1;
  if (S.ready) amt_nachLaden(); }, 300));
// „Er würde mit jedem mitgehen“: In Akte 06 steckt ein zweites, gefaltetes Blatt (Blatt wenden) – der Vermessungsbogen des Originals
function amt_akte06() { const S = amt_S; if (typeof files === 'undefined') return; const f = files.find(q => q.userData.name === 'Luke'); if (!f) return; uninteract(f);
  interact(f, () => S.akte06 ? 'Akte 06 · Blatt wenden' : 'Akte Luke', () => { ch2.read = ch2.read || new Set(); ch2.read.add('Luke');
    if (!S.akte06) return liftTo(f, () => openNote('Akte · Luke', FILE_TEXT.Luke, 'akteLuke', () => { S.akte06 = true; amt_side('k2_bogen'); }));
    liftTo(f, () => openNote('Vermessungsbogen Original', '<span style="font-family:\'Courier New\',monospace">Vermessungsbogen Original · Brandt, Luke, 9 · Frühjahr 2009.<br><br>Augen: blau. Narben: keine. Ängste: Spinnen, Dunkelheit.<br>Hund: Flocke. Lieblingslied: das aus der Spieluhr der Schwester.<br>Antwortet auf jede Frage zuerst mit ‚Klar!‘.</span><br><br><span class="hand">Anmerkung H. W.: Er würde mit jedem mitgehen, der fragt.</span>', 'vermessungsbogen', () => {
      if (S.bogen) return; S.bogen = true; amt_sideDone('k2_bogen', 'Das Original hatte Angst vor Spinnen. Hund: Flocke. „Er würde mit jedem mitgehen, der fragt.“');
      setTimeout(() => say([['Klar. Hab ich auch mal gesagt. Zu einer Stelle in der Stadt, die Nachtschicht hieß.', 4600, 'LUKE']]), 700);
      if (S.nr) setTimeout(() => gedanke('amt_nr8', 'Nummer 8. Ha. Ha. Ha.', 0, 2), 26000); })); }); }
