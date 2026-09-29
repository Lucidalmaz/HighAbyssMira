// =====================================================================  FOTOS (Modul „fotos“): Indizienwände statt Kinderzeichnungen
// Die „UFO-Bilder“ im Keller von Nr. 7 und im Kinderzimmer von Nr. 1 sind Fotos aus dem Spiel selbst (mit der Spielwelt und den echten Figuren
// aufgenommen: C:\Users\GIGABYTE\_fotos.js → game/assets/fotos/*.jpg), dokumentarisch aufgezogen wie eine Ermittlungswand: Stecknadeln, Karteikarten
// mit Datum/Ort/Quelle (Schreibmaschine), handschriftliche Anmerkungen, rote Fäden zu einer Mittelkarte.
//   Keller: Hildes Wand – sie hat jede Zyklusnacht fotografiert und gezählt; Mittelkarte „03:13 · ALLE SIEBEN“, darunter ihre rote Schrift.
//   Nr. 1:  Lucys Pinnwand von 2026 – was sie im Amt fand und was sie selbst wusste; Mittelkarte „LUKE = ?“.
// „Foto genau ansehen“ (E) zeigt die Vergrößerung als Aktenkarte (Beweis-Nr., Datum, Ort, Quelle, Anmerkung) und Lukes Beobachtung: jedes Foto
// enthält einen Hinweis. Die Wandflächen bleiben dieselben Objekte (uebergang.js zerschneidet die Kellerwand in Stücke) – nur die Textur wird getauscht.
const FOTOS = [
  { id: 'kreuzung', wall: 'keller', nr: 1, u: .075, v: .56, w: .085, rot: -.03, datum: '28.07.2009 · 23:41', ort: 'Kreuzung Ahornstraße', quelle: 'H. Wendt, Fenster Nr. 7', hand: 'Alle sieben. Zayn sieht her.', title: 'Beweis 1 · Kreuzung, 28. Juli 2009, 23:41',
    clue: 'Wenn du genau hinsiehst: Das Licht über der Laterne hat keinen Rand. Das ist kein Scheinwerfer – das ist ein Loch im Himmel. Die Kinder sehen nach oben. Bis auf eins: Das Kind ganz rechts sieht in die Kamera. Zayn. Als hätte er gewusst, dass es das letzte Foto ist.' },
  { id: 'nr3', wall: 'keller', nr: 2, u: .19, v: .34, w: .085, rot: .025, datum: '12.07.2026 · 03:13', ort: 'Straße vor Nr. 3', quelle: 'H. Wendt, Fenster Nr. 7', hand: 'Laterne aus. Mike barfuß. Von der Tankstelle her!', title: 'Beweis 2 · Nr. 3, 12. Juli 2026, 03:13',
    clue: 'Die Laterne vor Nr. 3 ist aus. Alle anderen brennen. Auf der Straße ein Mann – barfuß, mit dem Rücken zur Kamera. Mike. Er geht nicht zur Tankstelle. Er kommt von dort.\n\nUnd über den Dächern, wo Hilde gar nicht hingezielt hat: ein Schimmer, der auf keinem anderen Foto so tief hängt.' },
  { id: 'nr7', wall: 'keller', nr: 3, u: .56, v: .56, w: .085, rot: .04, datum: '01.08.2009 · 23:55', ort: 'Straße vor Nr. 7', quelle: 'Jonas W. (9), Mamas Kamera', hand: 'Mama guckt. – J.', title: 'Beweis 3 · Nr. 7, 1. August 2009, 23:55',
    clue: 'Hilde, im Nachthemd, mitten auf der Straße. Sie sieht nach oben. 23:55 – das ist die Minute, in der Lucy zurückkam.\n\nWer hat das fotografiert, wenn Hilde im Bild steht? Die Karteikarte sagt es: Jonas. Neun Jahre alt. Er hat mitgezählt, damit sie nicht allein zählt.' },
  { id: 'ufo1975', wall: 'keller', nr: 4, u: .71, v: .33, w: .085, rot: -.05, datum: 'Sommer 1975', ort: 'über dem Wald (Senke)', quelle: 'Lokalzeitung, Foto: Dr. T. Seiler', hand: 'Keine Lichter. Löcher.', title: 'Beweis 4 · „UFO über dem Abgrund“, 1975',
    clue: 'Ausgeschnitten, vergilbt, mit Klebeband an die Wand geheftet. Seilers Foto für die Lokalzeitung – die Schlagzeile, die er selbst diktiert hat.\n\nWenn du genau hinsiehst: Das Ding hat keine Lichter. Es hat Löcher, durch die etwas scheint, das heller ist als der Mond. Und der Wald darunter ist der Wald hinter dem Spielplatz. Die Senke ist nicht weit.' },
  { id: 'zwillinge', wall: 'keller', nr: 5, u: .87, v: .56, w: .085, rot: .02, datum: '27.07.2009 · 21:12', ort: 'Kreuzung, vor Nr. 1', quelle: 'H. Wendt', hand: 'Das achte Kind. Es hat sie angesehen.', title: 'Beweis 5 · Lucy und ich, 27. Juli 2009',
    clue: 'Einen Tag vor dem Licht. Lucy zappelt, ich halte still. Meine Augen sind blau auf dem Foto. Blau.\n\nUnd hinten, unter der Laterne, steht ein Kind, das nicht zu uns gehört. Klein, weiß, allein. Es sieht nicht in die Kamera. Es sieht uns an. … Hilde hat „das achte Kind“ daruntergeschrieben. Sie wusste es. Schon einen Tag vorher.' },
  { id: 'senke', wall: 'nr1', nr: 6, u: .17, v: .55, w: .15, rot: -.03, datum: '14.03.2011 · 02:58', ort: 'Senke hinter dem Gedenkfeld', quelle: 'Lucy (Handy)', hand: 'Ich war dabei. Ich hab sie gehen lassen.', title: 'Beweis 6 · Die Senke, 14. März 2011, 02:58',
    clue: 'Mama, von hinten, mit der Laterne. Sie geht in den Wald hinter dem Gedenkfeld. Frühjahr 2011 – die Nacht, in der sie den echten Luke holen wollte.\n\nLucys Schrift daneben: „Ich war dabei.“ Sie ist ihr nachgegangen. Lucy war dabei, und sie hat es mir nie gesagt.' },
  { id: 'bergung', wall: 'nr1', nr: 7, u: .5, v: .55, w: .15, rot: .02, datum: '13.07.1992 · 03:13', ort: 'Waldrand Nord', quelle: 'BfR-Archiv, Bergung 3', hand: 'Links: Gefr. Hofer. Hinten: ??? → Wald!', title: 'Beweis 7 · Bergung 3, 13. Juli 1992, 03:13',
    clue: 'Schwarzweiß, Amtsstempel auf der Rückseite: „BfR · B3 · 13.07.1992 · 03:13“. Lucy hat es aus dem Amt mitgenommen. Drei Männer am Waldrand. Der links, in Uniform: Gefreiter Hofer.\n\nUnd hinten zwischen den Stämmen, wo die Lampen nicht mehr hinreichen, steht etwas Aufrechtes. Zu groß für einen Hirsch. Es sieht her. Lucy hat einen Pfeil daneben gemalt: „Wald!“' },
  { id: 'kreuzung', wall: 'nr1', nr: 8, u: .83, v: .55, w: .15, rot: -.02, datum: '28.07.2009 · 23:41', ort: 'Kreuzung Ahornstraße', quelle: 'Abzug von Hildes Foto', hand: 'Z. sieht her. Warum? – Und wer ist der in der Mitte?', title: 'Beweis 8 · Abzug, Kreuzung, 28. Juli 2009',
    clue: 'Ein zweiter Abzug von Hildes Foto. Lucy hat mit Kuli einen Kreis um das Kind ganz rechts gemacht: „Z. sieht her. Warum?“\n\nUnd einen zweiten Kreis, kleiner, um das Kind in der Mitte. Um mich. Daneben nur ein Fragezeichen.' } ];
const fotos_S = { ready: false, seen: new Set(), hits: [] };
function fotos_img(id) { return new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = 'assets/fotos/' + id + '.jpg'; }); }
// Indizienwand: Nadeln, Fotos mit weißem Rand, Karteikarten (Schreibmaschine), Handschrift, rote Fäden zur Mittelkarte
function fotos_wand(list, imgs, W, H, { mitte, mitteText, tinte = '#1f2a55', extra } = {}) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.clearRect(0, 0, W, H);
  const pins = [], pin = (px, py) => { x.save(); x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 6; x.shadowOffsetY = 3; x.fillStyle = '#b8241c'; x.beginPath(); x.arc(px, py, W * .006, 0, 7); x.fill(); x.shadowBlur = 0; x.fillStyle = 'rgba(255,255,255,.45)'; x.beginPath(); x.arc(px - W * .002, py - W * .002, W * .0022, 0, 7); x.fill(); x.restore(); };
  const karte = (cx, cy, kw, kh, rot, lines, hand) => { x.save(); x.translate(cx, cy); x.rotate(rot); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 8; x.shadowOffsetY = 3; x.fillStyle = '#efe6cc'; x.fillRect(-kw / 2, -kh / 2, kw, kh); x.shadowBlur = 0; x.shadowOffsetY = 0;
    x.strokeStyle = 'rgba(120,100,70,.35)'; x.lineWidth = 1; for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(-kw / 2 + 6, -kh / 2 + kh * i / 4); x.lineTo(kw / 2 - 6, -kh / 2 + kh * i / 4); x.stroke(); }
    x.fillStyle = '#2a2622'; x.font = Math.round(kh * .17) + 'px "Courier New", monospace'; x.textAlign = 'left'; lines.forEach((l, i) => x.fillText(l, -kw / 2 + 10, -kh / 2 + kh * (i + 1) / 4 - kh * .05));
    if (hand) { x.fillStyle = tinte; x.font = Math.round(kh * .27) + 'px Caveat, cursive'; x.fillText(hand, -kw / 2 + 8, kh / 2 + kh * .32); } x.restore(); };
  // Mittelkarte
  const M = mitte ? { x: mitte[0] * W, y: (1 - mitte[1]) * H } : null;
  if (M) { const kw = W * .13, kh = kw * .55; x.save(); x.translate(M.x, M.y); x.rotate(.02); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 10; x.shadowOffsetY = 4; x.fillStyle = '#efe6cc'; x.fillRect(-kw / 2, -kh / 2, kw, kh); x.shadowBlur = 0; x.shadowOffsetY = 0;
    x.fillStyle = '#8a1a14'; x.font = 'bold ' + Math.round(kh * .34) + 'px "Courier New", monospace'; x.textAlign = 'center'; const L = mitteText.split('\n'); L.forEach((l, i) => x.fillText(l, 0, -kh / 2 + kh * (i + 1) / (L.length + 1) + kh * .12)); x.restore(); pins.push([M.x, M.y - kh / 2 + W * .004]); }
  // Fotos
  const fotoPins = [];
  for (const f of list) { const im = imgs[f.id]; if (!im) continue; const pw = f.w * W, ph = pw * 2 / 3, cx = f.u * W, cy = (1 - f.v) * H;
    x.save(); x.translate(cx, cy); x.rotate(f.rot); x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = 12; x.shadowOffsetY = 5;
    x.fillStyle = '#ece8dc'; x.fillRect(-pw / 2 - pw * .03, -ph / 2 - pw * .03, pw * 1.06, ph + pw * .06); x.shadowBlur = 0; x.shadowOffsetY = 0; x.drawImage(im, -pw / 2, -ph / 2, pw, ph);
    x.fillStyle = '#fff'; x.font = 'bold ' + Math.round(pw * .06) + 'px "Courier New", monospace'; x.textAlign = 'left'; x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(-pw / 2, ph / 2 - pw * .085, pw * .2, pw * .085); x.fillStyle = '#fff'; x.fillText('Nr. ' + f.nr, -pw / 2 + pw * .02, ph / 2 - pw * .025); x.restore();
    const px = cx + Math.sin(-f.rot) * ph * .55, py = cy - Math.cos(f.rot) * ph * .55; fotoPins.push([px, py]);
    karte(cx + pw * .02, cy + ph / 2 + pw * .2, pw * .96, pw * .27, f.rot * .6, [f.datum, f.ort, f.quelle], f.hand); }
  // rote Fäden (leicht durchhängend) von jeder Nadel zur Mittelkarte, dann die Nadeln obendrauf
  if (M) { x.save(); x.strokeStyle = '#b0201c'; x.lineWidth = Math.max(2, W * .0018); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 4; x.shadowOffsetY = 2;
    for (const [px, py] of fotoPins) { x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo((px + M.x) / 2, Math.max(py, M.y) + W * .02, M.x, M.y - W * .02); x.stroke(); } x.restore(); }
  for (const p of fotoPins.concat(pins)) pin(p[0], p[1]);
  if (extra) extra(x, W, H);
  const t = tex(c, true); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
function fotos_open(f) {
  const k = 'foto_' + f.wall + '_' + f.id;
  const akte = `<div class="beweis"><b>BEWEIS Nr. ${f.nr}</b><br>DATUM&nbsp;&nbsp;${f.datum}<br>ORT&nbsp;&nbsp;&nbsp;&nbsp;${f.ort}<br>QUELLE&nbsp;&nbsp;${f.quelle}</div>`;
  const html = akte + `<img src="assets/fotos/${f.id}.jpg" style="width:100%;max-width:520px;box-shadow:0 6px 30px rgba(0,0,0,.6);transform:rotate(${f.rot * 20}deg)"><span class="hand">${f.hand}</span>\n\n` + f.clue.replace(/\n/g, '<br>');
  Audio.paper(); openNote(f.title, html, k);
  if (!fotos_S.seen.size && typeof gedanke === 'function') gedanke('fotos_1', 'Das sind keine Zeichnungen. Das ist eine Ermittlung. Datum, Ort, Quelle – jemand hat das alles gesehen, sortiert und niemandem gezeigt.', 1500, 3);
  fotos_S.seen.add(k);
}
WORLD_MODS.push(['Fotos', async () => {
  const S = fotos_S, ids = [...new Set(FOTOS.map(f => f.id))], imgs = {}; await Promise.all(ids.map(async id => { imgs[id] = await fotos_img(id); }));
  if (!Object.values(imgs).some(Boolean)) { console.warn('Fotos: keine Bilder gefunden'); return; }
  try { await document.fonts.load('40px Caveat'); } catch (e) {}
  // Keller: Hildes Indizienwand (Fläche 8 × 3,8 m bei x 295,5…303,5, z 296,12); die Türöffnung (x 297,4…298,6) bleibt frei; die rote Schrift bleibt
  { const list = FOTOS.filter(f => f.wall === 'keller');
    const t = fotos_wand(list, imgs, 2048, 972, { mitte: [.465, .62], mitteText: '03:13\nALLE SIEBEN\nZURÜCK: 6', tinte: '#3a2a1a', extra: (x, w, h) => { x.fillStyle = '#7a0d0d'; x.font = 'bold 96px Georgia'; x.textAlign = 'left'; x.save(); x.translate(110, 760); x.rotate(-.04); x.fillText('SIE NEHMEN NUR DIE,', 0, 0); x.fillText('DIE SCHON MAL WEG WAREN', 80, 120); x.restore(); } });
    const art = B.wallArt; if (art && art.material) { const old = art.material.map; art.material.map = t; art.material.needsUpdate = true; scene.traverse(o => { if (o.isMesh && o !== art && o.material && o.material.map === old) { o.material.map = t; o.material.needsUpdate = true; } }); }
    for (const f of list) { const x = 295.5 + f.u * 8, y = f.v * 3.8, w = f.w * 8; const hit = box(w, w * .68, .12, x, y, 296.18, hidden, { cast: false }); interact(hit, 'Foto genau ansehen', () => fotos_open(f)); S.hits.push(hit); } }
  // Nr. 1, Kinderzimmer: Lucys Pinnwand (Fläche 4,8 × 2,4 m bei x −55,4…−50,6, y Y+0,3…Y+2,7, z −21,77)
  { const list = FOTOS.filter(f => f.wall === 'nr1');
    const t = fotos_wand(list, imgs, 1536, 768, { mitte: [.5, .12], mitteText: 'LUKE = ?', tinte: '#1f2a55', extra: (x, w, h) => { x.fillStyle = '#1f2a55'; x.font = '40px Caveat, cursive'; x.textAlign = 'left'; x.fillText('L. – nicht wegwerfen. Er muss das sehen.', 40, h - 24); } });
    let pl = null; scene.traverse(o => { if (!pl && o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry' && Math.abs(o.geometry.parameters.width - 4.8) < .01 && Math.abs(o.geometry.parameters.height - 2.4) < .01 && Math.abs(o.position.x + 53) < .1 && Math.abs(o.position.z + 21.77) < .1) pl = o; });
    if (pl) { pl.material = new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 1 }); }
    for (const f of list) { const x = -55.4 + f.u * 4.8, y = Y + .3 + f.v * 2.4, w = f.w * 4.8; const hit = box(w, w * .68, .12, x, y, -21.71, hidden, { cast: false }); interact(hit, 'Foto genau ansehen', () => fotos_open(f)); S.hits.push(hit); } }
  S.ready = true;
}]);
WORLD_TICK.push(() => {}); // Fotos brauchen keinen Takt (Pflichteintrag)
