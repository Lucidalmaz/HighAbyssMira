// =====================================================================  ENTDECKER (Modul „entdecker“): Wer genau hinsieht, wird belohnt
// 1) Die 17 Kerben: Kreidestriche an Laternenmasten in der ganzen Stadt (und eine am Hochsitz im tiefen Wald). Jede Kerbe gibt die nächste Zeile
//    eines Abzählreims – die Kleine zählt bis siebzehn. Alle 17: der ganze Reim und zwei Batterien.
// 2) Entdecker-Stufen nach Anzahl der Funde (alles in der Abenteuerfibel unter FUNDE): spürbare Belohnungen – Batterien, längerer Akku,
//    schnellerer Kinderblick, weiterer Lichtkegel, eine Erinnerung an die Nacht 2009, ein Satz auf der letzten Seite der Fibel.
// Fortschritt steht in der Abenteuerfibel (FUNDE) – mit der nächsten Belohnung, damit man weiß, wofür man sucht.
const ENTD_S = { ready: false, kerben: [], granted: new Set(), t: 0 };
const ENTD_REIM = ['Eins – ich zähl bis siebzehn, gebt gut acht,', 'Zwei – wer bei mir isst, der bleibt die Nacht.', 'Drei – wer ein Licht trägt, läuft mit mir,', 'Vier – ich blas es aus vor seiner Tür.', // Fassung 3 (AP-11): „Siebzehn und noch eins“ (85 §6)
  'Fünf – guckst du hin, dann steh ich still,', 'Sechs – guckst du weg, dann komm ich, wie ich will.', 'Sieben – Augen zu, dann seh ich dich nicht,', 'Acht – doch wer’s weiß, dem schau ich durchs Gesicht.',
  'Neun – was du sagst, das sag ich nach,', 'Zehn – nur nicht, was keiner laut sprach.', 'Elf – wer unter die Erde kriecht, wird nicht entdeckt,', 'Zwölf – Eisen ist frei, doch frei ist nicht versteckt.',
  'Dreizehn – an der Hand kommst du hinaus,', 'Vierzehn – lässt du los, fällst du aus der Zeit heraus.', 'Fünfzehn – wer einmal mit war, den find ich wieder,', 'Sechzehn – wer sich verschenkt, der kriegt sich nie mehr wieder.',
  'Siebzehn und noch eins – ich komme! Wen ich finde, der zählt.'];
const ENTD_STUFEN = [ // [Funde, Titel, Belohnung (Text), Wirkung(beimLaden)]
  [10, 'Aufmerksam', 'Zwei Batterien', load => { if (!load) addBattery(2); }],
  [20, 'Spürnase', 'Sparsame Lampe: der Akku hält ein Viertel länger', () => FLASH_TIERS.forEach(T => T.life = Math.round(T.life * 1.25))],
  [30, 'Kinderaugen', 'Kinderblick lädt schneller (50 statt 75 Sekunden)', () => { VISION_RECHARGE = 50; }],
  [45, 'Nachtwanderer', 'Weiterer Lichtkegel: 15 % mehr Reichweite', () => { FLASH_TIERS.forEach(T => T.distance = +(T.distance * 1.15).toFixed(1)); flashApply(); }],
  [60, 'Erinnerung', 'Eine Erinnerung an die Nacht 2009 kehrt zurück', load => { if (!load) entd_erinnerung(); }],
  [80, 'Alles gesehen', 'Eine Zeile auf der letzten Seite der Fibel', load => { if (!load) entd_letzteSeite(); }],
];
const entd_funde = () => story.lore.length;
const entd_kerbenN = () => story.lore.filter(l => /^kerbe_/.test(l.key)).length;
// Kreidestriche als Ring um den Mast (von allen Seiten zu sehen)
function entd_kreideTex(n) { return tex(cnv(256, (c, w) => { c.clearRect(0, 0, w, w); c.strokeStyle = 'rgba(236,232,220,.92)'; c.lineWidth = 7; c.lineCap = 'round';
  for (let rep = 0; rep < 3; rep++) { const ox = 12 + rep * 84; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(ox + i * 13 + rand(-2, 2), 70 + rand(-4, 4)); c.lineTo(ox + i * 13 + rand(-2, 2), 186 + rand(-4, 4)); c.stroke(); }
    c.beginPath(); c.moveTo(ox - 8, 160); c.lineTo(ox + 52, 92); c.stroke(); } }), true); }
WORLD_MODS.push(['Entdecker', async () => {
  const S = ENTD_S, T = THREE;
  // Masten wählen: über die ganze Stadt verteilt (größter Abstand zueinander), nicht im Amt, nicht im Kanal, nicht in der Villenhalle
  const poles = (typeof lamps !== 'undefined' ? lamps : []).map(L => ({ x: L.g.position.x, z: L.g.position.z, L })).filter(p => Math.abs(p.x) < 220 && p.z > -80 && p.z < 200);
  const pick = []; if (poles.length) { poles.sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z)); pick.push(poles[0]);
    while (pick.length < 16 && pick.length < poles.length) { let best = null, bd = -1; for (const p of poles) { if (pick.includes(p)) continue; const d = Math.min(...pick.map(q => Math.hypot(p.x - q.x, p.z - q.z))); if (d > bd) { bd = d; best = p; } } if (!best || bd < 12) break; pick.push(best); } }
  // Nutzer 02.10.: „Kreidestriche auf den Laternen schweben als Balken in der Luft“ – der Ring saß am Ursprung der Laterne, der gescannte Mast steht woanders.
  // Jetzt: das sichtbare Laternenmodell der Laterne auf 1,3 m Höhe mit parallelen Strahlen (von vier Seiten) abtasten → Mitte und Radius des Masts; Kreide liegt auf dem Lack.
  const rc = new T.Raycaster(); rc.far = 4; const mast = p => { const L = p.L, ziel = []; L.g.updateMatrixWorld(true);
    L.g.traverse(o => { if (o.isMesh && o !== L.bulb && o !== L.cone) { let v = true; for (let q = o; q && q !== L.g; q = q.parent) if (!q.visible) v = false; if (v) ziel.push(o); } });
    const pts = []; for (let k = -12; k <= 12; k++) { const q = k * .05; for (const [ox, oz, dx, dz] of [[-2, q, 1, 0], [2, q, -1, 0], [q, -2, 0, 1], [q, 2, 0, -1]]) {
      rc.set(new T.Vector3(p.x + ox, 1.3, p.z + oz), new T.Vector3(dx, 0, dz)); const h = rc.intersectObjects(ziel, false)[0]; if (h) pts.push(h.point); } }
    if (pts.length < 6) return null; const cx = pts.reduce((a, h) => a + h.x, 0) / pts.length, cz = pts.reduce((a, h) => a + h.z, 0) / pts.length;
    const r = pts.reduce((a, h) => a + Math.hypot(h.x - cx, h.z - cz), 0) / pts.length; return r > .35 ? null : { x: cx, z: cz, r: r + .004 }; };
  const spots = pick.map(p => { const m = mast(p); return m ? { id: Math.round(p.x) + '_' + Math.round(p.z), x: m.x, z: m.z, r: m.r, y: 1.3 } : null; }).filter(Boolean); // id wie bisher (Spielstände)
  if (typeof TIEF !== 'undefined') spots.push({ x: TIEF.stand.x - .85, z: TIEF.stand.z - .85, r: .12, y: 1.4, box: true }); // am Hochsitz-Pfosten
  const mat = new T.MeshBasicMaterial({ map: entd_kreideTex(), transparent: true, alphaTest: .3, depthWrite: false, side: T.DoubleSide, fog: true });
  spots.forEach((p, i) => { const id = p.id || Math.round(p.x) + '_' + Math.round(p.z), g = p.box ? new T.BoxGeometry(.2, .2, .2) : new T.CylinderGeometry(p.r, p.r, .2, 16, 1, true);
    const m = new T.Mesh(g, p.box ? new T.MeshBasicMaterial({ map: mat.map, transparent: true, alphaTest: .3, depthWrite: false }) : mat); m.position.set(p.x, p.y, p.z); m.userData.noCol = true; m.renderOrder = 2; scene.add(m);
    const hit = box(.5, .6, .5, p.x, p.y, p.z, hidden, { cast: false }); interact(hit, () => story.lore.some(l => l.key === 'kerbe_' + id) ? 'Kreidestriche' : 'Kreidestriche am Mast', () => entd_kerbe(id));
    S.kerben.push({ id, x: p.x, z: p.z, m }); if (typeof hintAdd === 'function') hintAdd({ id: 'kerbe_' + id, x: p.x, y: 0, z: p.z, kind: 'geheim', near: 26, open: () => !story.lore.some(l => l.key === 'kerbe_' + id) }); });
  S.total = S.kerben.length; S.ready = true;
}]);
function entd_kerbe(id) {
  const k = 'kerbe_' + id; if (story.lore.some(l => l.key === k)) { const l = story.lore.find(l => l.key === k); return openNote(l.title, l.html); }
  const n = entd_kerbenN() + 1, line = ENTD_REIM[Math.min(n, 17) - 1], tot = Math.min(17, ENTD_S.total || 17);
  const html = `Mit Kreide auf den Mast gemalt, in Kinderhöhe: Zählstriche, immer vier und einer quer.\n\nDarunter, klein:\n<span class="hand">„${line}“</span>`;
  story.lore.push({ key: k, title: `Kerbe ${n} / ${tot}`, html }); Audio.play('stones1', { gain: .12, rate: 2.2 }); if (Audio.chime) Audio.chime();
  questPop(`KERBE ${n} / ${tot}`, line); openNote(`Kerbe ${n} / ${tot}`, html);
  if (n === 1 && typeof gedanke === 'function') gedanke('kerbe_1', 'Kreidestriche. Wie beim Verstecken, wenn einer zählt. … Da sind bestimmt noch mehr.', 1500, 3);
  if (n === 8 && kapAb(3) && typeof gedanke === 'function') gedanke('kerbe_8', '‚Durchs Gesicht.‘ … Okay. Weiter.', 1500, 3); // 85 §6: Kerbe 8 nach Kapitel 2
  if (n >= tot) setTimeout(() => entd_reimFertig(), 1200);
  if (typeof saveGame === 'function' && state.started) saveGame(curChapter());
}
function entd_reimFertig() {
  if (story.lore.some(l => l.key === 'kerbe_reim')) return;
  const html = '<span class="hand">' + ENTD_REIM.join('\n') + '</span>\n\nDu hast den ganzen Reim. Am letzten Mast, ganz unten, hat jemand zwei Batterien in den Kies gedrückt. Als hätte jemand gewartet, dass du bis siebzehn kommst.';
  story.lore.push({ key: 'kerbe_reim', title: 'Der Abzählreim', html }); addBattery(2); questPop('ALLE KERBEN', 'Der Abzählreim ist vollständig');
  openNote('Der Abzählreim', html); if (typeof gedanke === 'function') gedanke('kerbe_alle', 'Siebzehn. Sie zählt nicht, um zu suchen. Sie zählt, damit sich alle rechtzeitig verstecken können.', 2500, 3);
}
function entd_erinnerung() {
  const html = 'Es kommt ohne Vorwarnung, beim Zählen der Funde:\n\nNackte Füße auf warmem Asphalt. Die Nacht ist heiß, der 5. August, drei Uhr dreizehn. Fünf Kinder im Schlafanzug stehen auf der Kreuzung und sehen dich an. Dich hält eine Hand, kalt wie Eisen.\n\nUnd irgendwo, ganz leise, sagt ein Mädchen: „Acht.“\n\n<i>Deine früheste Erinnerung. Du hast sie nie verstanden.</i>';
  story.lore.push({ key: 'entd_2009', title: 'Erinnerung: 5. August 2009', html }); setTimeout(() => { openNote('Eine Erinnerung', html); if (typeof gedanke === 'function') gedanke('entd_2009', 'Die kalte Hand. Das war kein Traum. Das war Eisen. Das war er.', 2500, 3); }, 900);
}
function entd_letzteSeite() {
  const html = 'Auf der letzten Seite der Abenteuerfibel steht etwas, das vorher nicht da war. Nicht deine Schrift. Ruhig, geschwungen, mit Tinte:\n\n<span class="hand">„Du hast hingesehen, wo alle weggesehen haben. Das reicht fürs Erste.\nHalt die Laterne gerade.\n— M.“</span>';
  story.lore.push({ key: 'entd_letzte', title: 'Die letzte Seite', html }); setTimeout(() => openNote('Die letzte Seite', html), 900);
}
// Stufen prüfen (alle 2 s); beim Laden werden die dauerhaften Wirkungen still wieder angewendet
function entd_check(load) {
  const n = entd_funde();
  for (let i = 0; i < ENTD_STUFEN.length; i++) { const [need, title, desc, fx] = ENTD_STUFEN[i]; if (n < need || ENTD_S.granted.has(i)) continue; ENTD_S.granted.add(i);
    try { fx(!!load); } catch (e) { console.warn('Entdecker', e); } if (!load) { questPop('ENTDECKER · ' + title.toUpperCase(), desc); Audio.play('keys2', { gain: .2, rate: 1.1 }); if (typeof saveGame === 'function') saveGame(curChapter()); } }
}
WORLD_TICK.push(dt => { const S = ENTD_S; if (!S.ready || !state.started) return; S.t -= dt; if (S.t > 0) return; S.t = 2; entd_check(false); });
MOD_SAVE.push(['entdecker', () => [...ENTD_S.granted], v => { ENTD_S.granted.clear(); for (const i of v) { ENTD_S.granted.add(i); try { ENTD_STUFEN[i][3](true); } catch (e) {} } }]);
// Abenteuerfibel → FUNDE: Fortschritt und nächste Belohnung
renderJournal = (o => () => { o(); if (jTab !== 'funde') return; const B = $('jBody'), n = entd_funde(), next = ENTD_STUFEN.find((s, i) => !ENTD_S.granted.has(i)), got = ENTD_STUFEN.filter((s, i) => ENTD_S.granted.has(i));
  const d = document.createElement('div'); d.className = 'entdBox';
  d.innerHTML = `<b>ENTDECKER</b> · ${n} Funde · Kerben ${entd_kerbenN()} / ${ENTD_S.total || 17}` + (next ? `<br>Nächste Belohnung bei <b>${next[0]}</b> Funden: ${next[2]}` : '<br>Alle Belohnungen erhalten.') + (got.length ? `<br><span>Erhalten: ${got.map(s => s[1]).join(' · ')}</span>` : '');
  B.prepend(d); })(renderJournal);
window.__entd = { S: ENTD_S, kerbe: id => entd_kerbe(id), check: () => entd_check(false), stufen: ENTD_STUFEN }; // Testzugriff
