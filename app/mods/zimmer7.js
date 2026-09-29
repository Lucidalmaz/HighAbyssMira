// =====================================================================  WELT-MODUL · zimmer7 (W2-P4, PK-D K2-2/K2-3)
// Zimmer 7 im Amt (Ebene −2): Hilde Wendts Büro südlich des Durchgangs, x 630–636, z −2608…−2602 (X + 30…36, Z − 8…Z − 2).
// Schlüsselkette: Ordnungstafel → Schublade (Vermessungsprotokoll, Schlüssel ZIMMER 7, Erleichterung) → Zimmer 7 (Schlüssel an Hildes Haken) → Sicherungsraum.
// Einrichtung nur aus Scan-Modellen (Stahlschreibtisch, Stuhl, Kommode, Aktenschrank, Rahmen, Stehlampe als Tischleuchte, Losurne, Dienstbuch, Tasse, Strickjacke);
// Wände/Boden mit Megascans-Oberflächen (Putz, Ölsockel, abgetretener Boden); Papiere, Aushang, Stadtplan, Kalender, Schlüsselbrett als Canvas-Decals.
// Licht: nur die Schreibtischlampe (VLight, beim Laden mit Intensität 0, hochgesetzt bei Kapitel-2-Beginn) + gemeinsames Schatten-Hauptlicht (KEY.list), solange man im Raum ist.
const z7_S = { ok: false, door: null, lamp: null, lampMats: [], keyOn: null, keyOff: null, aushang: null, aushangSpot: null, keySpot: null,
  relief: false, reliefP: null, reliefDone: false, gT: -1, printed: false, took: false, pending: null, uhr: 0 };
const Z7 = { x0: C2.x + 30, x1: C2.x + 36, z0: C2.z - 8, z1: C2.z - 2 };
function z7_in(m = .15) { const P = player.pos; return P.x > Z7.x0 + m && P.x < Z7.x1 - m && P.z > Z7.z0 + m && P.z < Z7.z1 - m; }
function z7_uhr(hh, mm) { try { if (typeof leben_uhr === 'function') leben_uhr(hh, mm, false); } catch (e) {} }

// ---------------------------------------------------------------- Texte (wortgleich PK-D K2-3)
const Z7_URNE = 'Sieben Holzkugeln, schwarz verkohlt, als hätte sie jemand ins Feuer gelegt und wieder herausgeholt. In jede ist ein Name gebrannt: REUTER, R. · WINTER, H. · KESSLER, M. · AYDIN, D. · BRANDT, L. · BRANDT, L. · WENDT, Z. – Zwei Kugeln tragen denselben Namen.';
const Z7_BUCH = [
  '<span class="hand">1.7.2009. Losziehung. Sieben aus Liste 2009.\nKugel 7: WENDT, Z.\nIch habe nicht neu gezogen. Das Los ist das Los.\nGott, er ist sieben. – H.W.</span>',
  '<span class="hand">14.7.2009. Einwilligung Brandt. Die Mutter hat zweimal angesetzt.\nSie hat gefragt, ob sie beide zurückbekommt.\nSeiler: Wir bringen zurück, was zurückkommt.\nSie hat unterschrieben. – H.W.</span>',
  '<span class="hand">21.10.2026. Lucy war heute unten. Sie hat alles gesehen. Auch das hier.\nWenn sie mich holen: Das Brot für den Jungen im Stall liegt in der Laube.\nKeiner darf ihn ansehen. Keiner. – H.W.</span>'];
const Z7_ROWS = [['Reuter', 'Roxy', 'Nr. 5', '03.07.'], ['Winter', 'Heidi', 'Nr. 2', '06.07.'], ['Vegas, L. (Großvater)', 'Mike Kessler', 'Nr. 3', '08.07.'], ['Aydın', 'Dina', 'Hof', '10.07.'], ['Brandt, M.', 'Lucy, Luke', 'Nr. 1', '14.07. (zwei Ansätze)'], ['Wendt, H.', 'Zayn', 'Nr. 7', '21.07.']];
const Z7_P4 = '§ 4 – Für jedes Kind errichtet die Gemeinde am Tag der Übergabe einen Gedenkstein. Die Einwilligung gilt über die Rückführung hinaus.';
const z7_table = (fs = 15) => `<table style="border-collapse:collapse;font-size:${fs}px;line-height:1.35;margin:8px 0 6px">` +
  `<tr>${['Erziehungsberechtigte', 'Kind', 'Haus', 'Datum'].map(h => `<th style="text-align:left;padding:2px 10px 2px 0;border-bottom:1px solid currentColor">${h}</th>`).join('')}</tr>` +
  Z7_ROWS.map(r => `<tr>${r.map(c => `<td style="padding:2px 10px 2px 0;vertical-align:top">${c}</td>`).join('')}</tr>`).join('') + '</table>';
const Z7_AUSHANG_HTML = () => `Maschinengeschrieben, die Unterschriften mit Füller.${z7_table(16)}<small>${Z7_P4}</small>`;
const Z7_GRUENDUNG = '<span class="hand">Aktennotiz Seiler, 1958: Der Mann in Eisen ist real. Er altert nicht. Er sagt, er dürfe nicht gefunden werden. Ich habe nicht gefragt, von wem. – Absender: Villa Seiler, Westweg.</span>';
const Z7_ECHO = { id: 'echo_zimmer7', at: [C2.x + 32.25, 1.15, C2.z - 6.35], title: 'Echo · Zimmer 7, 1. Juli 2009', floor: 0,
  figs: [E_(C2.x + 33.0, C2.z - 7.35, 0, 1), E_(C2.x + 32.9, C2.z - 3.2, PI, 1.04)],
  lines: [['1. Juli 2009. Eine Frau zieht eine Kugel aus einem Kasten, liest, hält inne.', 4200], ['„Frau Wendt?“', 2200, 'MANN VOM AMT'], ['„Das Los ist das Los.“', 3000, 'HILDE'], ['Sie legt die Kugel sehr vorsichtig auf den Tisch. Als könnte sie ihm wehtun.', 4400]] };
if (typeof FIGUREN_ECHO !== 'undefined') FIGUREN_ECHO.echo_zimmer7 = ['hilde', 'amt1'];

// Gegenstände (ITEMS entsteht erst nach den Modulen → modItem wartet)
modItem('zimmer7', 'Schlüssel „ZIMMER 7“', 'Lag mit einer Klammer am achten Protokoll. Am Ring ein Pappschild, Schreibmaschine: ZIMMER 7.', 'key');
modItem('einwilligungen', 'Einwilligungen 2009', `„Einwilligungen 2009 – vollständig“. Aushang aus Zimmer 7.${z7_table(14)}<small>${Z7_P4}</small>`, 'paper');
modItem('fuse', 'Schlüssel Sicherungsraum', 'Hing an Hildes Haken in Zimmer 7, neben der Tür.', 'fuse');

// ---------------------------------------------------------------- Klänge (synthetisch, einmalig)
function z7_snd(kind) {
  const A = Audio; if (!A.ctx) return; const t = A.ctx.currentTime;
  try {
    if (kind === 'cello') { // warmer, langer Ton (C3 + leicht verstimmt), weich gefiltert
      for (const f of [130.8, 131.2, 65.4]) { const o = A.osc('sawtooth', f, 0, 6.5), lp = A.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = f < 100 ? 300 : 820; lp.Q.value = .6; o.connect(lp); A.env(lp, f < 100 ? .03 : .045, 1.1, 4.8); }
    } else if (kind === 'atem') { // hörbares Ausatmen
      const n = A.noise(false), bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 620; bp.Q.value = .7; n.connect(bp); A.env(bp, .16, .22, 1.3); n.stop(t + 2);
    } else if (kind === 'drucker') { // Nadeldrucker, fern (Archiv): drei Zeilen, dazwischen Wagenrücklauf
      for (let l = 0; l < 3; l++) for (let i = 0; i < 26; i++) { const d = l * 1.25 + i * .034 + Math.random() * .006; const n = A.noise(false), bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600 + Math.random() * 900; bp.Q.value = 5; n.connect(bp); A.env(bp, .035, .002, .02, d); n.stop(t + d + .1); }
    }
  } catch (e) { console.warn('zimmer7 Klang', e); }
}

// ---------------------------------------------------------------- Schlüsselkette
// Aufruf aus der Basis (Schließen des Vermessungsprotokolls): Schlüssel ZIMMER 7 + die Erleichterung (einmal)
function z7_protokoll() {
  if (!ch2.z7Key) { ch2.z7Key = true; addItem('zimmer7'); setC2Objective('Finde Zimmer 7.'); z7_uhr(1, 31); }
  if (z7_S.relief) return; z7_S.relief = true;
  z7_S.reliefP = (async () => {
    await wait(700); await say([['Das achte Kind. Ein Mädchen.', 3200, 'LUKE']]);
    await wait(900); z7_snd('atem'); await wait(1300); z7_snd('cello'); await wait(900);
    await say([['Das bin nicht ich.', 3200, 'LUKE']]);
    z7_S.reliefDone = true; z7_S.gT = 90;
  })();
}
function z7_doorUse() {
  const D = z7_S.door; if (!D) return;
  if (D.locked) {
    if (!ch2.z7Key) return toast('Abgeschlossen. Ein Emailleschild: ZIMMER 7 · H. WENDT · ZÄHLUNG.', 3600);
    if (!z7_S.reliefDone && z7_S.reliefP) return; // erst die Erleichterung, dann die Tür (die Zeilen laufen noch)
    D.locked = false; Audio.play('lockOpen', { gain: .5, x: C2.x + 33, y: 1, z: C2.z - 2, ref: 2 }); toast('Der Schlüssel passt.', 2200);
  }
  if (D.open && typeof doorSwingBlocked === 'function' && doorSwingBlocked(D)) return toast('Du stehst in der Tür.', 1600);
  D.set(!D.open); if (Audio.doorSound) Audio.doorSound(D.open, D.pivot.position.x, D.pivot.position.z); else Audio.creak(.18);
}
function z7_takeKey() {
  if (z7_S.took) return; z7_S.took = true; ch2.fuseKey = true; addItem('fuse');
  if (z7_S.keyOn) z7_S.keyOn.visible = false; if (z7_S.keyOff) z7_S.keyOff.visible = true;
  Audio.play('keys1', { gain: .5, x: C2.x + 34.4, y: 1.5, z: C2.z - 2.2, ref: 2 });
  toast('Ein Schlüssel an einem roten Band. Auf dem Anhänger, in Hildes Schrift: SICHERUNG.', 4200);
  if (!ch2.power) setC2Objective('Finde den Sicherungsraum und schalte den Strom ein.');
  try { if (typeof todCheckpoint === 'function') todCheckpoint('zimmer7', 'Zimmer 7'); } catch (e) {}
}
function z7_takeAushang() {
  if (story.items.includes('einwilligungen')) return;
  addItem('einwilligungen'); if (z7_S.aushang) z7_S.aushang.visible = false; if (z7_S.aushangRest) z7_S.aushangRest.visible = true; if (z7_S.aushangSpot) z7_S.aushangSpot.userData.label = 'Klebereste';
  Audio.paper(); setTimeout(() => say([['Sie hat uns aufgeschrieben. Mama auch.', 3400, 'LUKE']]), 500);
}
// story.items entsteht erst nach den Modulen (Aufbau ruft das hier schon auf)
function z7_syncAushang() { const t = !!story.items && story.items.includes('einwilligungen'); if (z7_S.aushang) z7_S.aushang.visible = !t; if (z7_S.aushangRest) z7_S.aushangRest.visible = t; }

// ---------------------------------------------------------------- Spielstand
MOD_SAVE.push(['zimmer7', () => ({ k7: !!ch2.z7Key, open: z7_S.door ? !z7_S.door.locked : false, sk: !!z7_S.took, rel: !!z7_S.reliefDone, pr: !!z7_S.printed }), v => { z7_S.pending = v; }]);
// Kapitel 2 beginnt (auch beim Weiterspielen): Lampe an; nach der Wiederherstellung des Speicherpunkts (Modul tod) die Kette von Zimmer 7 richtigstellen
CH2_BEGIN.push(() => {
  z7_lampSet(true);
  setTimeout(() => { try {
    const v = z7_S.pending; z7_S.pending = null;
    if (!ch2.archiveSolved) return z7_syncAushang(); // Kapitelanfang: alles wie neu
    ch2.z7Key = true; if (!story.items.includes('zimmer7')) story.items.push('zimmer7');
    z7_S.relief = z7_S.reliefDone = true; // die Erleichterung ist schon passiert
    const took = v ? !!v.sk || ch2.power : ch2.power;
    if (v && v.open && z7_S.door) z7_S.door.locked = false; if (v && v.pr) z7_S.printed = true;
    if (took) { z7_S.took = true; ch2.fuseKey = true; if (z7_S.keyOn) z7_S.keyOn.visible = false; if (z7_S.keyOff) z7_S.keyOff.visible = true; }
    else { ch2.fuseKey = false; fuseDoor.locked = true; story.items = story.items.filter(k => k !== 'fuse'); if (!ch2.power) setC2Objective('Finde Zimmer 7.'); } // Speicherpunkte vor Zimmer 7: der Sicherungsraum bleibt zu
    z7_syncAushang();
  } catch (e) { console.warn('zimmer7 Wiederherstellung', e); } }, 0);
});
function z7_lampSet(on) {
  const L = z7_S.lamp; if (!L) return; L.intensity = on ? 3.2 : 0;
  for (const m of z7_S.lampMats) m.emissiveIntensity = on ? 1.1 : 0;
}

// Skelett-Modell (Strickjacke) → feste Geometrie in der Ruhepose (kein Skinning im Bild, sauberer Hüllkörper)
function z7_static(root) {
  root.updateMatrixWorld(true); const g = new THREE.Group(), v = new THREE.Vector3(); let n = 0;
  root.traverse(o => { if (!o.isMesh) return; const geo = o.geometry.clone();
    if (o.isSkinnedMesh) { o.skeleton.update(); const P = geo.attributes.position; for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); o.applyBoneTransform(i, v); P.setXYZ(i, v.x, v.y, v.z); } geo.deleteAttribute('skinIndex'); geo.deleteAttribute('skinWeight'); }
    geo.applyMatrix4(o.matrixWorld);
    geo.computeVertexNormals(); geo.computeBoundingBox(); const m = new THREE.Mesh(geo, o.material); g.add(m); n++; });
  g.userData.parts = n; return g;
}
// ---------------------------------------------------------------- Aufbau
WORLD_MODS.push(['Zimmer 7', async () => {
  const S = z7_S, V = THREE.Vector3, X = C2.x, Z = C2.z, H = C2.h;
  const x0 = Z7.x0, x1 = Z7.x1, z0 = Z7.z0, z1 = Z7.z1, iX0 = x0 + .15, iX1 = x1 - .15, iZ0 = z0 + .15, iZ1 = z1 - .15;
  try { await document.fonts.load('40px Caveat'); await document.fonts.load('30px "Special Elite"'); } catch (e) {}
  let rs = 77; const R = (a, b) => { rs = (rs * 16807) % 2147483647; return a + (b - a) * (rs / 2147483647); };
  const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
  const surf = (key, tint, tile = 2, nrm = 1) => { const m = msSurfMat(key, { tint, nrm }); m.userData.tile = tile; return m; };
  const decalMat = (c, rough = .9) => new THREE.MeshStandardMaterial({ map: tex(c, true), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, roughness: rough });
  const paperMat = (c, rough = .95) => new THREE.MeshStandardMaterial({ map: tex(c, true), roughness: rough, side: THREE.DoubleSide });
  const batch = new Batch();
  // Wandfläche (ry: Blickrichtung 0 → +z, π → −z, π/2 → +x, −π/2 → −x), UVs in Weltmetern
  const face = (mat, x, y, z, w, h, ry, tile = 2, u0 = 0) => { const g = new THREE.PlaneGeometry(w, h); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w + u0) / tile, (uv.getY(i) * h + y - h / 2) / tile); batch.add(g, mat, mtx(x, y, z, ry)); };
  const hit = (x, y, z, w, h, d, label, fn) => { const b = box(w, h, d, x, y, z, hidden, { cast: false }); interact(b, label, fn); return b; };

  // --- Durchgang: Südwand neu, mit Türöffnung bei X + 33 (die Basiswand wird samt Kollision ausgeblendet)
  const old = msFind((o, bb) => o.material === M.block && o.geometry.type === 'BoxGeometry' && Math.abs(o.position.x - (X + 33)) < .05 && Math.abs(o.position.z - (Z - 2)) < .05 && Math.abs((o.geometry.parameters || {}).width - 6) < .05);
  old.forEach(msHide);
  wall('x', Z - 2, X + 30, X + 36, H, M.block, [{ at: X + 33, w: 1.2 }], .3);
  box(1.2, H - 2.2, .3, X + 33, 2.2 + (H - 2.2) / 2, Z - 2, M.block); // Sturz über der Tür
  // --- Raum: Südwand, West-/Ost-Stücke (den Rest tragen Archiv- und Prüfraumwand), Boden, Decke
  box(6.3, H, .3, X + 33, H / 2, z0, M.block, { collide: true });
  box(.3, H, 2.0, x0, H / 2, z0 + 1.0, M.block, { collide: true });
  box(.3, H, 3.0, x1, H / 2, z0 + 1.5, M.block, { collide: true });
  const floorMat = surf('floor_worn', 0x8c8070, 2.2); floorMat.roughness = 1;
  plane(x1 - x0, z1 - z0, (x0 + x1) / 2, .01, (z0 + z1) / 2, floorMat);
  const ceilMat = surf('wall_plaster', 0x77726a, 2.5); box(x1 - x0 + .6, .2, z1 - z0 + .3, (x0 + x1) / 2, H + .1, (z0 + z1) / 2 - .15, ceilMat, { cast: false });
  // Innenwände: Kalkputz oben, grüngrauer Ölsockel unten (1,3 m), dunkle Trennlinie
  const upper = surf('wall_plaster', 0xc9c0a8, 2), lower = surf('wall_damaged', 0x7c8a78, 2.4, .8), line = new THREE.MeshStandardMaterial({ color: 0x2c332c, roughness: .6 });
  const DADO = 1.3, UH = H - DADO;
  const wallFaces = (x, z, len, ry, cut) => { // cut: [von, bis] längs der Wand (Tür)
    const along = (a, b) => { const w = b - a, c = (a + b) / 2; const px = ry === 0 || ry === PI ? c : x, pz = ry === 0 || ry === PI ? z : c;
      face(upper, px, DADO + UH / 2, pz, w, UH, ry, 2, a); face(lower, px, DADO / 2, pz, w, DADO, ry, 2.4, a); face(line, px, DADO, pz, w, .025, ry); };
    const [a, b] = len; if (!cut) return along(a, b); along(a, cut[0]); along(cut[1], b);
    const w = cut[1] - cut[0], c = (cut[0] + cut[1]) / 2; face(upper, ry === 0 || ry === PI ? c : x, 2.2 + (H - 2.2) / 2, ry === 0 || ry === PI ? z : c, w, H - 2.2, ry, 2, cut[0]); };
  wallFaces(0, iZ0 + .004, [iX0, iX1], 0);                                 // Süd (Blick nach Norden)
  wallFaces(0, iZ1 - .004, [iX0, iX1], PI, [X + 32.4, X + 33.6]);          // Nord mit Tür
  wallFaces(iX0 + .004, 0, [iZ0, iZ1], PI / 2);                            // West
  wallFaces(iX1 - .004, 0, [iZ0, iZ1], -PI / 2);                           // Ost
  // Türzarge innen/außen (Stahlzarge, grau gestrichen) – schmale Streifen um die Öffnung
  const zarge = new THREE.MeshStandardMaterial({ color: 0x4d524c, roughness: .55, metalness: .5 });
  for (const zz of [Z - 1.84, iZ1 - .006]) { const ry = zz > Z - 2 ? 0 : PI; face(zarge, X + 32.36, 1.1, zz, .08, 2.2, ry); face(zarge, X + 33.64, 1.1, zz, .08, 2.2, ry); face(zarge, X + 33, 2.2, zz, 1.36, .08, ry); }

  // --- Tür (makeDoor, verschlossen): Blatt steht auf dem Amtsboden (y 0), sichtbar ist das Scan-Türblatt
  const D = S.door = makeDoor(X + 33, Z - 2.08, 1.2, 1.5, M.metal); D.locked = true;
  D.leaf.position.y = 1.09; D.pivot.children.forEach(c => { if (c !== D.leaf) c.position.y = 1.02; });
  interact(D.leaf, () => D.locked ? 'Zimmer 7' : D.open ? 'Tür schließen' : 'Tür öffnen', z7_doorUse);
  try { const dm = (await msModel('door1')).clone(true); const g = new THREE.Group(); g.add(dm); dm.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(dm), sz = bb.getSize(new V()); dm.scale.set(1.18 / sz.x, 2.18 / sz.y, .06 / sz.z); dm.updateMatrixWorld(true);
    const b2 = new THREE.Box3().setFromObject(dm); dm.position.set(-b2.min.x, -b2.min.y, -(b2.min.z + b2.max.z) / 2); dm.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
    g.position.set(.01, 0, 0); D.pivot.add(g); D.leaf.material = hidden; D.pivot.children.forEach(c => { if (c !== D.leaf && c !== g) c.visible = false; });
  } catch (e) { console.warn('zimmer7 Türblatt', e); D.leaf.material = surf('planks_painted', 0x8a8c80, 1.2); }
  // Türschild außen (Emaille) – „ZIMMER 7 · H. WENDT · ZÄHLUNG“
  batch.add(new THREE.PlaneGeometry(.34, .15), decalMat(cv(512, 226, (c, w, h) => { c.fillStyle = '#e2dccb'; c.fillRect(6, 6, w - 12, h - 12); c.strokeStyle = '#1f2624'; c.lineWidth = 8; c.strokeRect(16, 16, w - 32, h - 32);
    c.fillStyle = '#1f2624'; c.textAlign = 'center'; c.font = 'bold 74px Arial'; c.fillText('ZIMMER 7', w / 2, 104); c.font = '30px Arial'; c.fillText('H. WENDT · ZÄHLUNG', w / 2, 166);
    for (let i = 0; i < 9; i++) { const px = R(0, w), py = R(0, 1) < .5 ? R(0, 20) : R(h - 20, h); c.fillStyle = '#19181a'; c.beginPath(); c.arc(px, py, R(3, 9), 0, 7); c.fill(); } }), .35), mtx(X + 34.05, 1.58, Z - 1.843, 0));
  hit(X + 34.05, 1.58, Z - 1.8, .36, .18, .08, 'Türschild', () => toast('Ein Emailleschild, an den Kanten abgeplatzt: ZIMMER 7 · H. WENDT · ZÄHLUNG.', 3800));

  // --- Möbel und Dinge (Scans), normiert: Unterkante y = 0, Mitte x/z = 0
  const norm = (obj, dims) => { const g = new THREE.Group(); g.add(obj); obj.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(obj), sz = bb.getSize(new V());
    if (dims.s) obj.scale.multiplyScalar(dims.s / (dims.axis === 'max' ? Math.max(sz.x, sz.y, sz.z) : sz[dims.axis || 'y'])); else obj.scale.set(dims.x / sz.x, dims.y / sz.y, dims.z / sz.z);
    obj.updateMatrixWorld(true); const b2 = new THREE.Box3().setFromObject(obj), c = b2.getCenter(new V()); obj.position.x -= c.x; obj.position.z -= c.z; obj.position.y -= b2.min.y;
    obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material) [].concat(o.material).forEach(m => { m.envMapIntensity = .5; }); } }); return g; };
  const place = (g, x, z, o = {}) => { g.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ'); g.position.set(0, 0, 0); g.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(g);
    let px = x - (b.min.x + b.max.x) / 2, pz = z - (b.min.z + b.max.z) / 2; if (o.minX !== undefined) px = o.minX - b.min.x; if (o.maxX !== undefined) px = o.maxX - b.max.x; if (o.minZ !== undefined) pz = o.minZ - b.min.z; if (o.maxZ !== undefined) pz = o.maxZ - b.max.z;
    g.position.set(px, (o.y || 0) - b.min.y, pz); scene.add(g); g.updateMatrixWorld(true); return g; };
  const topY = (g, x, z, from = 2.4) => { const h = new THREE.Raycaster(new V(x, from, z), new V(0, -1, 0)).intersectObject(g, true)[0]; return h ? h.point.y : 0; };
  const load = async (name, fn) => { try { return await fn(); } catch (e) { console.warn('zimmer7 Modell ' + name, e); return null; } };
  const [mTable, mChair, mDresser, mWard, mFrame, mLamp, mUrne, mBuch, mTasse, mJacke] = await Promise.all([
    load('metaltable', async () => (await msModel('metaltable')).clone(true)),
    load('chair', () => msFBX('chair', 'model.fbx', { '*': { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg' } })),
    load('dresser', () => msFBX('dresser', 'model.fbx', { 'Wood-1': { b: 'T_Wood-1_BaseColor.jpg', n: 'T_Wood-1_Normal.jpg', r: 'T_Wood-1_Roughness.jpg', ao: 'T_Wood-1_Ao.jpg' }, 'Wood-2': { b: 'T_Wood-2_BaseColor.jpg', n: 'T_Wood-2_Normal.jpg', r: 'T_Wood-2_Roughness.jpg', ao: 'T_Wood-2_Ao.jpg' }, 'Wood-3': { b: 'T_Wood-3_BaseColor.jpg', n: 'T_Wood-3_Normal.jpg', r: 'T_Wood-3_Roughness.jpg', ao: 'T_Wood-3_Ao.jpg' }, Metal: { b: 'T_Metal_BaseColor.jpg', n: 'T_Metal_Normal.jpg', r: 'T_Metal_Roughness.jpg', m: 'T_Metal_Metallic.jpg' } })),
    load('wardrobe', async () => (await msModel('wardrobe')).clone(true)),
    load('frame_deco', async () => (await msModel('frame_deco')).clone(true)),
    load('floorlamp', async () => (await msModel('floorlamp')).clone(true)),
    load('w_urne', async () => (await msModel('w_urne', 'model.glb')).clone(true)),
    load('w_buch', async () => (await msModel('w_buch', 'model.glb')).clone(true)),
    load('w_tasse', async () => (await msModel('w_tasse', 'model.glb')).clone(true)),
    load('w_jacke', async () => z7_static(await msFBX('w_jacke', 'model.fbx', { '*': { b: 'model.jpg', rough: .95, ds: true } })))]);

  // Schreibtisch: Stahltisch, 1,45 × 0,75 m, mitten im Raum vor der Südwand – Hilde saß mit dem Gesicht zur Tür
  const DX = X + 33.55, DZ = z0 + 1.55; let deskTop = .76, desk = null;
  if (mTable) { desk = place(norm(mTable, { x: 1.45, y: .76, z: .74 }), DX, DZ); deskTop = topY(desk, DX + .1, DZ + .05) || .76; }
  // Stuhl: zurückgeschoben und leicht gedreht, als wäre sie eben aufgestanden; Strickjacke über der Lehne
  let chair = null; if (mChair) chair = place(norm(mChair, { s: .93 }), DX - .25, DZ - .78, { ry: .32 });
  if (mJacke && chair) { const j = norm(mJacke, { s: .5, axis: 'x' }); const cb = new THREE.Box3().setFromObject(chair); place(j, 0, 0, { ry: .32 + PI, y: cb.max.y - .34 });
    j.position.x += (DX - .25 - Math.sin(.32) * .17) - (new THREE.Box3().setFromObject(j).getCenter(new V()).x); j.position.z += (DZ - .78 - Math.cos(.32) * .17) - (new THREE.Box3().setFromObject(j).getCenter(new V()).z); S.jacke = j; }
  // Kommode an der Westwand (Losurne obenauf), Aktenschrank an der Ostwand, Rahmen mit Foto an der Ostwand
  let dres = null, dresTop = 1.2; if (mDresser) { dres = place(norm(mDresser, { x: .78, y: 1.2, z: .42 }), 0, z1 - 1.25, { ry: PI / 2, minX: iX0 + .01 }); dresTop = topY(dres, iX0 + .22, z1 - 1.25) || 1.2; }
  if (mWard) place(norm(mWard, { s: 1.95 }), 0, z1 - 1.25, { ry: PI, maxX: iX1 - .01 });
  if (mFrame) { const fg = norm(mFrame, { s: .56 }); place(fg, 0, z0 + 1.35, { ry: -PI / 2, y: 1.28, maxX: iX1 - .005 }); }
  // Zayn, 2009 (Foto im Rahmen)
  batch.add(new THREE.PlaneGeometry(.25, .36), new THREE.MeshStandardMaterial({ roughness: .4, map: tex(cv(256, 368, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#a08f70'); g.addColorStop(1, '#5e4f3a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.filter = 'blur(2px)'; c.fillStyle = '#3a3026'; c.beginPath(); c.arc(128, 140, 46, 0, 7); c.fill(); c.fillRect(66, 184, 124, 190); c.fillStyle = '#c9b89a'; c.beginPath(); c.arc(128, 146, 34, 0, 7); c.fill(); c.fillStyle = '#2a2018'; c.fillRect(112, 160, 32, 6); c.filter = 'none';
    c.fillStyle = 'rgba(240,232,210,.18)'; c.fillRect(0, 0, w, 40); }), true) }), mtx(iX1 - .03, 1.28 + .215, z0 + 1.35, -PI / 2));
  hit(iX1 - .06, 1.5, z0 + 1.35, .1, .56, .42, 'Foto', () => toast('Ein Junge mit Zahnlücke, im Rahmen, blass geworden. Unten am Rand, in Hildes Schrift: „Zayn“.', 4200));

  // Schreibtischlampe: Leuchte als Scan, Licht beim Laden mit 0 (Kapitel-2-Beginn setzt es hoch)
  const LX = DX + .52, LZ = DZ + .16;
  if (mLamp) { const lg = norm(mLamp, { x: .3, y: .56, z: .3 }); place(lg, LX, LZ, { y: deskTop, ry: .6 }); lg.updateMatrixWorld(true);
    const lb = new THREE.Box3().setFromObject(lg); lg.traverse(o => { if (!o.isMesh) return; const b = new THREE.Box3().setFromObject(o); if ((b.min.y + b.max.y) / 2 < lb.min.y + (lb.max.y - lb.min.y) * .55) return;
      o.material = [].concat(o.material).map(m => { const n = m.clone(); n.emissive = new THREE.Color(0xffb46a); n.emissiveMap = n.map || null; n.emissiveIntensity = 0; S.lampMats.push(n); return n; }); if (o.material.length === 1) o.material = o.material[0]; });
    S.lampTop = lb.max.y; }
  const lamp = S.lamp = new VLight(0xffc27e, 0, 5.2, 2); lamp.position.set(LX, (S.lampTop || deskTop + .56) - .16, LZ); scene.add(lamp);
  KEY.list.push({ v: lamp, I: 3.2, on: () => !!ch2.on && z7_in(-.05) });

  // Auf dem Schreibtisch: Dienstbuch (aufgeschlagen liegt die Brille nicht – das Buch ist zu), Tasse mit eingetrocknetem Tee, Aktenstapel, Stifte (Papier-Decals)
  const onDesk = (g, x, z, ry, dy = 0) => place(g, x, z, { ry, y: (desk ? topY(desk, x, z) : deskTop) + dy });
  let buch = null, tasse = null, urne = null;
  if (mBuch) buch = onDesk(norm(mBuch, { s: .26, axis: 'max' }), DX - .05, DZ + .08, .25);
  if (mTasse) { tasse = onDesk(norm(mTasse, { s: .09 }), DX - .52, DZ + .2, 2.2);
    const tb = new THREE.Box3().setFromObject(tasse); batch.add(new THREE.CircleGeometry(.032, 20), new THREE.MeshStandardMaterial({ color: 0x3a220f, roughness: .35, metalness: .05 }), new THREE.Matrix4().compose(new V((tb.min.x + tb.max.x) / 2, tb.max.y - .025, (tb.min.z + tb.max.z) / 2), new THREE.Quaternion().setFromEuler(new THREE.Euler(-PI / 2, 0, 0)), new V(1, 1, 1))); }
  const docC = (seed, title) => cv(256, 362, (c, w, h) => { rs = 100 + seed * 37; c.fillStyle = ['#d9d1b9', '#d4ccb3', '#ddd6c1'][seed % 3]; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { const g = c.createRadialGradient(R(0, w), R(0, h), 0, R(0, w), R(0, h), R(40, 130)); g.addColorStop(0, `rgba(120,90,40,${R(.04, .14)})`); g.addColorStop(1, 'rgba(120,90,40,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
    c.fillStyle = '#242220'; c.font = 'bold 12px "Special Elite", Courier New'; c.fillText('AMT FÜR RÜCKFÜHRUNG · ZÄHLUNG', 16, 30); c.font = '11px "Special Elite", Courier New'; c.fillText(title, 16, 48); c.fillRect(16, 54, 224, 1.2);
    for (let i = 0; i < 18; i++) { if (R(0, 1) < .14) continue; c.fillStyle = `rgba(30,30,30,${R(.5, .8)})`; c.fillRect(16, 72 + i * 14, R(70, 220), 4.5); } });
  const docs = [['Liste 2009 · Abschrift', 0], ['Rückführung · Zählung 17', 1], ['Anlage B · Gedenksteine', 2], ['Formblatt 8', 3]].map(([t, i]) => paperMat(docC(i, t)));
  const flatOn = (mat, x, z, w, h, rot, y) => batch.add(new THREE.PlaneGeometry(w, h), mat, new THREE.Matrix4().compose(new V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(-PI / 2, rot, 0, 'YXZ')), new V(1, 1, 1)));
  { const y = (desk ? topY(desk, DX + .28, DZ - .1) : deskTop) + .003; for (let i = 0; i < 4; i++) flatOn(docs[i], DX + .3 + R(-.015, .015), DZ - .12 + R(-.01, .01), .21, .297, .08 + R(-.05, .05), y + i * .004);
    flatOn(docs[1], DX - .4, DZ - .18, .21, .297, -.35, y + .001);
    flatOn(decalMat(cv(128, 32, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#1b2a4a'; c.fillRect(8, 12, 100, 8); c.fillStyle = '#b8a060'; c.fillRect(96, 12, 12, 8); c.fillStyle = '#111'; c.beginPath(); c.moveTo(8, 12); c.lineTo(0, 16); c.lineTo(8, 20); c.fill(); }), .4), DX - .33, DZ - .1, .15, .036, 1.1, y + .006); }
  // Losurne auf der Kommode
  if (mUrne) urne = place(norm(mUrne, { s: .28 }), iX0 + .24, z1 - 1.25, { y: dresTop, ry: .4 });

  // --- Wand: Pinnwand mit Stadtplan (Westwand, Süd), Aushang (Nordwand links der Tür), Kalender Juli 2009 (Südwand), Schlüsselbrett (Nordwand rechts der Tür)
  const cork = cv(1024, 720, (c, w, h) => { c.fillStyle = '#6d4a2c'; c.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { c.fillStyle = `rgba(${R(30, 60) | 0},${R(18, 36) | 0},8,${R(.2, .5)})`; c.fillRect(R(0, w), R(0, h), R(1, 3), R(1, 3)); }
    for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(200,150,90,${R(.1, .3)})`; c.fillRect(R(0, w), R(0, h), 1.5, 1.5); } c.strokeStyle = '#3b2a1c'; c.lineWidth = 26; c.strokeRect(0, 0, w, h);
    // Stadtplan: Ahornstraße, Häuser nummeriert, sieben rote Nadeln (Nr. 1 mit zwei)
    c.save(); c.translate(90, 70); c.rotate(-.012); c.fillStyle = '#e6dfca'; c.fillRect(0, 0, 610, 470); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2; c.strokeRect(0, 0, 610, 470);
    c.fillStyle = '#1e1d1a'; c.font = 'bold 22px "Special Elite", Courier New'; c.fillText('LOST EYENGLESS · AHORNSTRASSE', 24, 36); c.font = '13px "Special Elite", Courier New'; c.fillText('Stand 1998 · M 1:1000', 24, 56);
    c.fillStyle = '#b9b09a'; c.fillRect(20, 228, 570, 44); c.fillRect(290, 70, 40, 390); c.fillStyle = '#6a6252'; c.font = 'italic 15px Georgia'; c.fillText('Ahornstraße', 40, 256);
    const hs = [['1', 60, 150], ['2', 170, 150], ['3', 390, 150], ['4', 500, 150], ['5', 60, 300], ['6', 170, 300], ['7', 390, 300], ['Hof', 500, 330]];
    c.strokeStyle = '#2a2824'; c.lineWidth = 2.5; for (const [n, x, y] of hs) { c.strokeRect(x, y, 80, 62); c.fillStyle = '#2a2824'; c.font = 'bold 20px "Special Elite", Courier New'; c.fillText(n === 'Hof' ? 'Hof' : 'Nr. ' + n, x + 12, y + 38); }
    const pin = (x, y) => { c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(x + 4, y + 5, 9, 0, 7); c.fill(); const g = c.createRadialGradient(x - 3, y - 3, 1, x, y, 10); g.addColorStop(0, '#ff6a5a'); g.addColorStop(1, '#8a120c'); c.fillStyle = g; c.beginPath(); c.arc(x, y, 10, 0, 7); c.fill(); };
    pin(92, 162); pin(122, 176); pin(208, 164); pin(430, 162); pin(540, 344); pin(96, 312); pin(428, 312); c.restore();
    // zwei Zettel daneben
    c.save(); c.translate(760, 90); c.rotate(.05); c.fillStyle = '#dcd4bc'; c.fillRect(0, 0, 200, 250); c.fillStyle = '#2b2a28'; c.font = '14px "Special Elite", Courier New'; c.fillText('DIENSTPLAN ZÄHLUNG', 14, 28); for (let i = 0; i < 9; i++) c.fillRect(14, 48 + i * 20, R(80, 170), 3.5); c.restore();
    c.save(); c.translate(770, 400); c.rotate(-.06); c.fillStyle = '#e8e2cf'; c.fillRect(0, 0, 190, 150); c.fillStyle = '#1f2a55'; c.font = '30px Caveat'; c.fillText('23:00 – 03:13', 16, 50); c.fillText('Kreuzung zählen.', 16, 92); c.fillText('Immer.', 16, 130); c.restore();
    c.fillStyle = '#c21a12'; c.beginPath(); c.arc(860, 100, 9, 0, 7); c.fill(); c.beginPath(); c.arc(865, 408, 9, 0, 7); c.fill(); });
  batch.add(new THREE.PlaneGeometry(1.3, .914), new THREE.MeshStandardMaterial({ map: tex(cork, true), roughness: .95 }), mtx(iX0 + .012, 1.55, z0 + 1.55, PI / 2));
  hit(iX0 + .08, 1.55, z0 + 1.55, .12, .9, 1.3, 'Pinnwand', () => toast('Ein Stadtplan der Ahornstraße, die Häuser nummeriert. Sieben rote Stecknadeln. In Nr. 1 stecken zwei.', 5200));
  // Aushang „Einwilligungen 2009 – vollständig“ (Nordwand, links der Tür)
  const AX = X + 31.25, AY = 1.5, AZ = iZ1 - .012;
  const aushangC = cv(724, 1024, (c, w, h) => { c.fillStyle = '#e4ddc8'; c.fillRect(0, 0, w, h); rs = 991;
    for (let i = 0; i < 10; i++) { const g = c.createRadialGradient(R(0, w), R(0, h), 0, R(0, w), R(0, h), R(80, 260)); g.addColorStop(0, `rgba(130,100,50,${R(.04, .12)})`); g.addColorStop(1, 'rgba(130,100,50,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
    c.fillStyle = '#1d1c1a'; c.font = '22px "Special Elite", Courier New'; c.fillText('AMT FÜR RÜCKFÜHRUNG · Außenstelle Lost Eyengless', 44, 70); c.fillRect(44, 84, w - 88, 2);
    c.font = 'bold 40px "Special Elite", Courier New'; c.fillText('Einwilligungen 2009', 44, 150); c.font = '30px "Special Elite", Courier New'; c.fillText('– vollständig', 44, 192);
    const cols = [44, 300, 470, 560], hd = ['Erziehungsber.', 'Kind', 'Haus', 'Datum']; c.font = 'bold 20px "Special Elite", Courier New'; hd.forEach((t, i) => c.fillText(t, cols[i], 262)); c.fillRect(44, 272, w - 88, 1.5);
    c.font = '19px "Special Elite", Courier New';
    const rows = [['Reuter', 'Roxy', 'Nr. 5', '03.07.'], ['Winter', 'Heidi', 'Nr. 2', '06.07.'], ['Vegas, L.', 'Mike Kessler', 'Nr. 3', '08.07.'], ['Aydın', 'Dina', 'Hof', '10.07.'], ['Brandt, M.', 'Lucy, Luke', 'Nr. 1', '14.07.'], ['Wendt, H.', 'Zayn', 'Nr. 7', '21.07.']];
    rows.forEach((r, k) => { const y = 318 + k * 88; r.forEach((t, i) => c.fillText(t, cols[i], y)); if (k === 2) { c.font = '14px "Special Elite", Courier New'; c.fillText('(Großvater)', 44, y + 20); c.font = '19px "Special Elite", Courier New'; }
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(44, y + 56); c.lineTo(w - 44, y + 56); c.stroke();
      c.save(); c.strokeStyle = '#1b2656'; c.lineWidth = 2.2; c.lineCap = 'round'; const sx = 300, sy = y + 44; // Unterschrift (Füller)
      const sig = (ox, oy, s) => { c.beginPath(); c.moveTo(sx + ox, sy + oy); for (let q = 0; q < 9; q++) c.quadraticCurveTo(sx + ox + q * 18 * s + 8, sy + oy - R(4, 16), sx + ox + (q + 1) * 18 * s, sy + oy + R(-3, 4)); c.stroke(); };
      if (k === 4) { sig(0, -2, .7); c.lineWidth = 1.6; c.beginPath(); c.moveTo(sx - 4, sy - 6); c.lineTo(sx + 128, sy - 2); c.stroke(); c.lineWidth = 2.2; sig(140, 2, .8); } else sig(0, 0, .95); c.restore(); });
    c.fillStyle = '#1d1c1a'; c.font = '15px "Special Elite", Courier New'; const p4 = ['§ 4 – Für jedes Kind errichtet die Gemeinde am Tag der Übergabe', 'einen Gedenkstein. Die Einwilligung gilt über die Rückführung hinaus.']; p4.forEach((t, i) => c.fillText(t, 44, 900 + i * 24));
    c.fillStyle = 'rgba(210,200,160,.6)'; for (const [x, y, r] of [[40, 30, -.5], [w - 40, 30, .5], [40, h - 30, .5], [w - 40, h - 30, -.5]]) { c.save(); c.translate(x, y); c.rotate(r); c.fillRect(-40, -12, 80, 24); c.restore(); } });
  S.aushang = new THREE.Mesh(new THREE.PlaneGeometry(.42, .594), new THREE.MeshStandardMaterial({ map: tex(aushangC, true), roughness: .92, polygonOffset: true, polygonOffsetFactor: -2 })); S.aushang.position.set(AX, AY, AZ); S.aushang.rotation.set(0, PI, .012); S.aushang.receiveShadow = true; scene.add(S.aushang);
  S.aushangRest = new THREE.Mesh(new THREE.PlaneGeometry(.46, .63), decalMat(cv(256, 352, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(255,250,235,.10)'; c.fillRect(10, 10, w - 20, h - 20); c.fillStyle = 'rgba(214,202,160,.8)'; for (const [x, y, r] of [[14, 12, -.5], [w - 14, 12, .5], [14, h - 12, .5], [w - 14, h - 12, -.5]]) { c.save(); c.translate(x, y); c.rotate(r); c.fillRect(-16, -5, 32, 10); c.restore(); } }), .8));
  S.aushangRest.position.set(AX, AY, AZ - .002); S.aushangRest.rotation.y = PI; S.aushangRest.visible = false; scene.add(S.aushangRest);
  S.aushangSpot = hit(AX, AY, AZ - .05, .46, .64, .1, 'Aushang', () => { if (story.items.includes('einwilligungen')) return toast('Vier Streifen Klebeband, ein hellerer Fleck im Putz. Da hing sie.', 3000); openNote('Einwilligungen 2009 – vollständig', Z7_AUSHANG_HTML(), 'z7_aushang', z7_takeAushang); });
  // Kalender, Juli 2009 (nie weitergeblättert), der Erste eingekreist
  batch.add(new THREE.PlaneGeometry(.3, .45), decalMat(cv(300, 450, (c, w, h) => { c.fillStyle = '#e8e2d0'; c.fillRect(0, 0, w, h); c.fillStyle = '#6a7a5a'; c.fillRect(0, 0, w, 170); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(20, 20, w - 40, 130);
    c.fillStyle = '#1d1c1a'; c.font = 'bold 34px Georgia'; c.fillText('JULI 2009', 60, 214); c.font = '16px Georgia'; const d0 = 2; // 1.7.2009 = Mittwoch
    for (let d = 1; d <= 31; d++) { const k = d + d0 - 1, x = 26 + (k % 7) * 37, y = 262 + Math.floor(k / 7) * 34; c.fillText(String(d), x, y); if (d === 1) { c.strokeStyle = '#b01810'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(x + 6, y - 6, 16, 14, 0, 0, 7); c.stroke(); } }
    c.fillStyle = '#9a1a12'; c.font = '20px Caveat'; c.fillText('Los', 22, 250); }), .9), mtx(X + 32.35, 1.6, iZ0 + .012, 0));
  // Schlüsselbrett mit Hildes Haken (Nordwand innen, rechts der Tür): mit und ohne Schlüssel
  const board = (withKey) => decalMat(cv(512, 256, (c, w, h) => { c.clearRect(0, 0, w, h); const g = c.createLinearGradient(0, 40, 0, 120); g.addColorStop(0, '#6a4a30'); g.addColorStop(1, '#4a3220'); c.fillStyle = g; c.fillRect(20, 40, w - 40, 80); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(20, 116, w - 40, 6);
    for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(30,18,8,${R(.1, .3)})`; c.fillRect(R(20, w - 20), R(40, 120), R(4, 30), 1); }
    for (let i = 0; i < 4; i++) { const x = 90 + i * 110; c.fillStyle = '#b8b0a0'; c.beginPath(); c.arc(x, 96, 7, 0, 7); c.fill(); c.strokeStyle = '#8a8478'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, 96); c.quadraticCurveTo(x, 130, x + 14, 124); c.stroke();
      c.fillStyle = '#e4ddc8'; c.fillRect(x - 26, 50, 52, 22); c.fillStyle = '#222'; c.font = '14px "Special Elite", Courier New'; c.fillText(['ARCHIV', 'SICHER.', 'PRÜF 3', 'MESS'][i], x - 24, 66); }
    if (withKey) { const x = 200; c.strokeStyle = '#a01810'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 8, 126); c.lineTo(x + 2, 170); c.stroke(); c.strokeStyle = '#8f8a70'; c.lineWidth = 5; c.beginPath(); c.arc(x + 2, 180, 11, 0, 7); c.stroke();
      c.fillStyle = '#9c8f5c'; c.fillRect(x - 2, 190, 9, 50); c.fillRect(x + 6, 222, 12, 6); c.fillRect(x + 6, 232, 9, 6); c.fillStyle = '#d8d0b4'; c.save(); c.translate(x + 26, 176); c.rotate(.3); c.fillRect(0, 0, 44, 22); c.fillStyle = '#1f2a55'; c.font = '15px Caveat'; c.fillText('Sicherung', 2, 16); c.restore(); } }), .8);
  const KX = X + 34.45, KY = 1.52, KZ = iZ1 - .012;
  S.keyOn = new THREE.Mesh(new THREE.PlaneGeometry(.6, .3), board(true)); S.keyOn.position.set(KX, KY, KZ); S.keyOn.rotation.y = PI; scene.add(S.keyOn);
  S.keyOff = new THREE.Mesh(new THREE.PlaneGeometry(.6, .3), board(false)); S.keyOff.position.set(KX, KY, KZ - .001); S.keyOff.rotation.y = PI; S.keyOff.visible = false; scene.add(S.keyOff);
  S.keySpot = hit(KX, KY, KZ - .05, .62, .32, .1, () => z7_S.took ? 'Schlüsselbrett' : 'Schlüssel am Haken', () => { if (z7_S.took) return toast('Vier Haken, vier Schildchen. Am zweiten fehlt jetzt der Schlüssel.', 3000); z7_takeKey(); });

  // --- Fundstücke (Klickflächen an den echten Dingen)
  if (urne) { const b = new THREE.Box3().setFromObject(urne); hit((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2, .36, b.max.y - b.min.y + .06, .36, 'Die Losurne', () => { Audio.play('woodHit1', { gain: .2, rate: 1.4, x: b.min.x, y: 1.3, z: b.min.z, ref: 2 }); openNote('Die Losurne', Z7_URNE, 'z7_urne'); }); }
  if (buch) { const b = new THREE.Box3().setFromObject(buch); hit((b.min.x + b.max.x) / 2, b.max.y + .03, (b.min.z + b.max.z) / 2, .34, .1, .3, 'Das Dienstbuch', () => {
    if (!story.lore.some(l => l.key === 'z7_dienstbuch')) story.lore.push({ key: 'z7_dienstbuch', title: 'Das Dienstbuch', html: Z7_BUCH.join('\n\n') });
    Audio.paper(); Z7_BUCH.forEach((p, i) => openNote(`Das Dienstbuch · Seite ${i + 1} / 3`, p + (i < 2 ? '\n\n<small>[E] umblättern</small>' : ''))); }); }
  hit(DX, deskTop - .1, DZ - .4, .5, .14, .06, 'Schreibtischschublade', () => { Audio.play('woodSqueak1', { gain: .3, rate: 1.3, x: DX, y: .6, z: DZ, ref: 2 }); openNote('Gründungsnotiz 1958', Z7_GRUENDUNG, 'z7_gruendung'); });
  if (tasse) { const b = new THREE.Box3().setFromObject(tasse); hit((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2, .14, .14, .14, 'Tasse', () => toast('Tee, eingetrocknet zu einem braunen Ring. Am Rand ein Abdruck von Lippenstift.', 3600)); }
  if (S.jacke) { const b = new THREE.Box3().setFromObject(S.jacke); hit((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2, .5, .5, .3, 'Strickjacke', () => toast('Eine Strickjacke, graublau, an den Ellbogen gestopft. Sie riecht noch nach ihr. Nach Kernseife und kaltem Rauch.', 4600)); }
  // Nachhall am Schreibtisch
  try { addEcho(Z7_ECHO); } catch (e) { console.warn('zimmer7 Echo', e); }

  // --- Spuren: Staub im Lichtkegel nicht; Schmutz am Sockel, ausgetretener Weg Tür → Schreibtisch, Spinnweben in zwei Ecken
  const grime = msSurfMat('grime', { alpha: true, tint: 0x6a6258 }); grime.roughnessMap = null; grime.roughness = .95; grime.opacity = .55;
  flatOn(grime, X + 33.1, z1 - 1.3, .9, 1.6, .15, .013); flatOn(grime, X + 33.3, z0 + 2.4, .8, 1.1, 1.2, .014); flatOn(grime, iX0 + .5, z0 + .5, .7, .7, 2.2, .012); flatOn(grime, iX1 - .5, z0 + .45, .8, .6, .7, .012);
  try { const webs = msFind(o => o.material && o.material.transparent && o.material.alphaTest === .12 && o.material.color && o.material.color.getHex() === 0xd8d4c8); if (webs.length) { const w0 = webs[0];
    for (const [x, z, ry, s] of [[iX0 + .2, iZ0 + .2, PI / 4, .8], [iX1 - .2, iZ0 + .22, -PI / 4, .7], [iX1 - .25, iZ1 - .2, -3 * PI / 4, .6]]) { const m = new THREE.Mesh(w0.geometry, w0.material); m.scale.setScalar(.0105 * s); m.position.set(x, H - .2, z); m.rotation.set(-PI / 4, ry, R(-.2, .2), 'YXZ'); m.renderOrder = 2; scene.add(m); } } } catch (e) {}

  batch.flush(scene, false);
  z7_syncAushang(); S.ok = true;
}]);

// ---------------------------------------------------------------- pro Bild (keine Allokationen)
WORLD_TICK.push((dt) => {
  const S = z7_S; if (!S.ok || !ch2.on) return;
  // Erster Schritt in Zimmer 7: der Nadeldrucker im Archiv, 01:47
  if (!S.printed && z7_in(.4)) { S.printed = true; z7_uhr(1, 47); z7_snd('drucker'); setTimeout(() => { if (!state.talking) subtitle('Im Archiv rattert ein Nadeldrucker: „05.11.2026 · 01:47 · Ersatz 08 betritt Zimmer 7.“', 5600); }, 900); }
  // 90 s nach „Das bin nicht ich.“
  if (S.gT > 0) { S.gT -= dt; if (S.gT <= 0) { const t = 'Ein Mädchen. Nicht ich. … Warum fühlt sich das an, als hätte ich Glück gehabt?';
      if (typeof gedanke === 'function') gedanke('z7_glueck', t); else if (!state.talking) subtitle(t, 5200, 'LUKE'); } }
  // Amt-Uhr (PK-D) an den Story-Punkten: Strom 02:10 · Prüfraum 02:26 · Gang 02:41 · Messraum 02:58 (nie rückwärts)
  const x = player.pos.x - C2.x;
  if (S.uhr < 1 && ch2.power) { S.uhr = 1; z7_uhr(2, 10); }
  if (S.uhr < 2 && ch2.power && x > 36.5 && x < 46) { S.uhr = 2; z7_uhr(2, 26); }
  if (S.uhr < 3 && x > 46.5 && x < 106) { S.uhr = 3; z7_uhr(2, 41); }
  if (S.uhr < 4 && x > 106.5 && x < 125) { S.uhr = 4; z7_uhr(2, 58); }
});
window.__z7 = { S: z7_S, protokoll: () => z7_protokoll(), door: () => z7_doorUse(), key: () => z7_takeKey(), aushang: () => z7_takeAushang(), inRoom: () => z7_in() }; // Testzugriff
