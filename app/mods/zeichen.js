// =====================================================================  ZEICHEN (Modul „zeichen“, X-7): mysteriöse Symbole und Zeichen in der Welt
// Nutzerwunsch X-7 (F3_extras.md): nur kanonfeste Zeichen als Graffiti, Kreide, Ritzungen in Rinde/Stein/Holz/Putz und Brandzeichen – im Ort, am Kirchberg, in den
// Schrebergärten, am Hof, an der Villenmauer, im Tunnel zum Amt, in der Kanalstadt (Außenstelle 3) und ab Kap. 6 im Wald. Jedes Zeichen hat eine Bedeutung (Spalte „was“).
// ∴ nur als Drei-Punkt (nie Ein-Punkt vor Kap. 7) · „LWO“ fällt in keinem Text (nur das Auge) · keine neuen Weltfakten, keine Auflösung.
// Sichtbarkeit (Spalte s): 0 immer · 1 nur im Streiflicht der Taschenlampe (Kegel trifft flach auf; die Ritzung hat echte Tiefe über die Normal-Map)
//   · 2 nur im Blitz der Kamera (Kap. 5, kamera.js – das Zeichen ist nur im Polaroid zu sehen) · 3 Kreide: frisch ab Kapitel k[0], verblasst je Kapitel (× 0,55), der Blitz zeigt sie ganz
//   neu: true → die Kreide erscheint, während Luke wegsieht (Lunas „ICH KOMME“ und das Kind mit der Laterne, Kap. 3).
// Technik: EIN Canvas-Atlas (2048², Farbe + Alpha; Höhen-Canvas → Normal-Map je Zelle), EIN Material; je Bereich EIN Mesh (ein Zeichenaufruf, Puffer vorab angelegt);
//   jedes Zeichen wird erst gesetzt, wenn Luke ihm auf 38 m nahe kommt (zwei je Bild) – entfernte Kulissen sind bei anderen Modulen bis dahin ausgeblendet. Die Zeichen schmiegen sich per Strahl gegen die Kollisions-BVH der Basis (SOL) an Rinde, Stein und Putz an. Keine Lichter, keine
//   Allokation im Takt. Sichtbarkeit rechnet der Shader (Taschenlampen-Uniformen der Basis: fogUniforms.flP/flD/flK, Kapitel uKap, Blitz uBlitz).
// Nazca-Prinzip: zwei Scharrbilder als EINE durchgehende Linie im Waldboden vor dem Hochsitz (Kap. 6) – der Rabe und der Hirsch mit dem verkehrt sitzenden Kopf;
//   vom Boden nur Furchen, vom Hochsitz lesbar. Wer sie gezogen hat, bleibt offen.
// GTA-V-Prinzip: Wandbild „Unser Dorf“ (Klasse 3b, 1976) an der Mauer neben der Haltestelle Kirchberg; sechs versteckte Zeichen weisen auf echte Verstecke
//   (ZEICHEN_WAND_HINWEISE), ohne Lösung im Text. Ein Versteck ist neu (x7_tor, über TAUSCH_FUNDE), die anderen gibt es schon.
// Spielstand 'zeichen' = { neu: [ids] }. Testzugriff: __zeichen (am window).
const ZEICHEN_ORTE = { // Bau beim ersten Annähern (Mitte, Radius); k = ab Kapitel; kanal = in der Kanalstadt
  ort: { x: 10, z: -4, r: 105 }, kirchberg: { x: -20, z: 68, r: 72 }, gaerten: { x: -115, z: 25, r: 46 }, hof: { x: -128, z: -24, r: 44 },
  villa: { x: -108, z: 60, r: 36 }, tunnel: { x: 609, z: -2600, r: 34 }, kanal: { kanal: true }, wald: { x: 18, z: 126, r: 70, k: 6 }, tief: { x: 18, z: 180, r: 50, k: 6 } };
// Zeichen-Tabelle. Ort: ray [ox, oy, oz, dx, dy, dz, weit] · such [x, y, z, r] (nächste senkrechte Fläche) · boden [x, z, Blick-Gierwinkel] · lampe [x, z] (nächste Laterne)
// m = Motiv im Atlas, w = Breite in m (Höhe aus dem Motiv), rot = Drehung in der Fläche, op = Deckkraft, k = [ab, bis] Kapitel, luke = Gedanke (einmal), foto = Gedanke nach dem Polaroid
const ZEICHEN_TAB = [
  // ---- Ort
  { id: 'kirchweg_drei', a: 'ort', m: 'drei_stein', s: 1, ray: [-7.9, .78, 15.6, -1, 0, 0, 2.6], w: .17, rot: .12, was: '∴ – das Zeichen des Beobachters, alt in einen Mauerstein gekratzt',
    luke: 'Drei Punkte, in den Stein gekratzt. Alt. Und keiner hat sie weggeschrubbt.' },
  { id: 'mast_auge', a: 'ort', m: 'auge_schab', s: 0, op: .78, ray: [0, 1.62, 6.0, 0, 0, 1, 2.4], w: .21, was: 'Auge über der Flamme im Kreis – Messmarke des Amts, gesprüht wie eine Vermessungsmarke',
    luke: 'Ein Auge über einer Flamme. Gesprüht wie eine Vermessungsmarke. Was vermisst man an einem Strommast?' },
  { id: 'laterne_drin', a: 'ort', m: 'aufkleber', s: 0, lampe: [-20, -6], w: .11, rot: -.08, was: 'Aufkleber „ICH WAR DRIN“ – Dorfgerücht über Lichter am Himmel, mit Augenzwinkern' },
  { id: 'nr9_graffiti', a: 'ort', m: 'g_nr9', s: 0, op: .93, ray: [43.0, 1.4, -14.2, 1, 0, 0, 3], w: 2.4, was: 'Jugend-Graffiti: Band „SCHIMMEL“, Herz, ein klein dazwischengesetztes ∴ – Alltag und Zeichen gemischt' },
  { id: 'nr7_striche', a: 'ort', m: 'striche_blei', s: 0, op: .8, ray: [24.25, 1.32, -10.9, 0, 0, -1, 2.6], w: .34, rot: -.03, was: 'Strichliste in Fünfergruppen neben Hildes Tür (Hilde zählt)' },
  { id: 'nr8_dina', a: 'ort', m: 'dina_kreide', s: 0, op: .42, ray: [48.6, .98, 11.0, 0, 0, 1, 2.6], w: .6, was: 'Dinas Kreise „von unten“ (Kreis, Flamme, Stiel), uralte Kinderkreide unter dem Fenster der Aydıns' },
  { id: 'kreuzung_komme', a: 'ort', m: 'komme_kreide', s: 3, k: [3, 7], neu: true, nurNeu: true, boden: [3.0, -2.3, 0], w: 4.4, rot: .03, was: 'Lunas weiße Kreide „ICH KOMME“ und siebzehn Striche (Kap. 3, erscheint im Rücken)',
    luke: 'Das war eben noch nicht da.' },
  { id: 'nr1_kreise', a: 'ort', m: 'kreise7_schimmer', s: 2, k: [5, 5], ray: [-49.6, 1.25, -10.4, 0, 0, -1, 2.8], w: 1.5, was: 'Sieben Kreise und ein halber (Lunas Zählung) an Nr. 1 – nur im Polaroid',
    foto: 'Auf dem Foto sind Kreise an der Wand. An der Wand sind keine.' },
  { id: 'tanke_graffiti', a: 'ort', m: 'g_tanke', s: 0, op: .9, ray: [110.6, 1.45, 33.2, 0, 0, -1, 3.2], w: 2.4, was: 'Jugend-Graffiti an der Tankstelle: „HIER LANDEN VERBOTEN“, Herz, ein abgemaltes Auge mit Fragezeichen' },
  { id: 'tanke_alien', a: 'ort', m: 'g_alien', s: 0, op: .9, ray: [107.5, 1.45, 33.2, 0, 0, -1, 3.2], w: 2.4, was: 'Alien-Schablone der Dorfjugend: grauer Kopf, „NIMM MICH MIT“, darunter „VEGAS HAT RECHT“ – Witz über Lichter am Himmel und Vegas’ Theorien' },
  { id: 'schrott_zaehl', a: 'ort', m: 'g_zaehl', s: 0, op: .92, ray: [113, 1.4, -14, 1, 0, 0, 4], w: 2.4, was: 'Am Schrottplatz, rostrot und gelaufen: „ZÄHL NICHT MIT“, darunter siebzehn Striche, klein ∴ – wer hier gezählt hat, bleibt offen' },
  // 08.10.: drei weitere Wände (Gartenmauern an der Hauptstraße, Nr. 7 und gegenüber): Mystery „Auge im Dreieck“, Alien „Abholung“, Horror „Nicht umdrehen“
  { id: 'mauer_auge', a: 'ort', m: 'g_auge', s: 0, op: .92, ray: [28.6, 1.4, -10.6, 0, 0, -1, 2.6], w: 2.4, was: 'Mystery-Graffiti der Dorfjugend: Auge im Dreieck, „ES SIEHT UNS ZU“, „WER ZÄHLT?“, klein ∴' },
  { id: 'mauer_abholung', a: 'ort', m: 'g_abholung', s: 0, op: .9, ray: [-52.2, 1.4, -10.6, 0, 0, -1, 2.6], w: 2.4, was: 'Alien-Graffiti: Untertasse mit Lichtkegel, Strichmännchen schwebt hinauf, „HALLOWEEN KOMMEN SIE“, „ICH WAR DRIN“' },
  { id: 'mauer_umdrehen', a: 'ort', m: 'g_umdrehen', s: 0, op: .92, ray: [-48.4, 1.4, -10.6, 0, 0, -1, 2.6], w: 2.4, k: [2, 7], was: 'Horror-Graffiti: weiße Kinderhand, „NICHT UMDREHEN“, acht Striche, der sechste fehlt' },
  { id: 'schrott_sumpfgas', a: 'ort', m: 'g_sumpfgas', s: 0, op: .92, ray: [114.4, 1.4, -10.4, 1, 0, 0, 3], w: 2.4, was: 'Verschwörungswand der Dorfjugend: „SUMPFGAS?“ durchgestrichen, „LÜGE!“, „Alufolie hilft“, „sie gucken“ – die Zeitungszeile von damals, verspottet' },
  // ---- Kirchberg
  { id: 'tor_turm', a: 'kirchberg', m: 'turm_alt', s: 1, ray: [-56.2, .62, 65.2, 0, 0, 1, 2.6], w: .3, rot: -.05, was: 'Turm über dem Abgrund (Wappen), alte Ritzung an der Friedhofsmauer neben dem Tor' },
  { id: 'mauer_birke', a: 'kirchberg', m: 'birke_alt', s: 1, ray: [-64.6, .58, 68.8, 0, 0, -1, 2.6], w: .22, rot: .06, was: '1312-Motiv Birke, verwittert, innen an der alten Friedhofsmauer' },
  { id: 'kapelle_laterne', a: 'kirchberg', m: 'laterne_alt', s: 1, ray: [-61.8, .95, 89.0, 1, 0, 0, 3], w: .3, was: '1312-Motiv Laterne, verwittert, an der Kapelle beim ältesten Stein' },
  { id: 'bank_jahre', a: 'kirchberg', m: 'jahre_holz', s: 0, op: .95, ray: [-46.7, 1.4, 77.75, 0, -1, 0, 1.3], w: .2, rot: .3, was: 'Jahreszahlen im 17er-Takt in die Friedhofsbank geschnitzt, darunter Platz',
    luke: '1958, 1975, 1992, 2009. Alle siebzehn Jahre. Darunter ist noch Platz.' },
  { id: 'spielplatz_kind', a: 'kirchberg', m: 'kind_kreide', s: 3, k: [3, 7], neu: true, boden: [29.2, 71.4, .4], w: .95, was: 'Lunas Strichmännchen mit Laterne (Kap. 3, erscheint im Rücken)' },
  { id: 'spielplatz_zaehlen', a: 'kirchberg', m: 'k_zaehlen', s: 0, k: [3, 3], boden: [27.2, 73.4, .4], w: 2.6, was: 'Lunas Zählen in Kinderkreide: 1 bis 17, die Sieben verkehrt herum, dann „UND NOCH EINS“ (nur Kap. 3)' },
  // ---- Schrebergärten
  { id: 'schuppen_kreise', a: 'gaerten', m: 'kreise7_holz', s: 1, such: [-121.8, 1.2, 33.4, 3.5], w: .66, was: 'Sieben Kreise und ein halber, mit dem Messer in die Bretter am Schuppen von Parzelle 7' },
  { id: 'brunnen_turm', a: 'gaerten', m: 'turm_alt', s: 1, such: [-105.6, .62, 34.6, 2.2], w: .26, was: 'Turm über dem Abgrund, alt, im Brunnenstein' },
  // ---- Hof
  { id: 'remise_brand', a: 'hof', m: 'kreise7_brand', s: 0, op: .9, such: [-124.6, 1.25, -30.2, 4], w: .72, was: 'Brandzeichen wie an der Kuh: sieben Kreise und ein halber' },
  { id: 'hof_dina', a: 'hof', m: 'dina_schimmer', s: 2, k: [5, 5], ray: [-124.9, 1.15, -12.6, 1, 0, 0, 2.8], w: .5, was: 'Dinas Kreis von unten am Hofhaus – nur im Polaroid' },
  // ---- Villa
  { id: 'villa_graffiti', a: 'villa', m: 'g_villa', s: 0, op: .9, such: [-104.6, 1.2, 57.4, 3.2], w: 2.4, was: 'Mutprobe an der Villenmauer: „SPUKHAUS“, „TIM WAR DRIN 2014“ – darunter „LÜGNER“' },
  { id: 'villa_turm', a: 'villa', m: 'turm_alt', s: 1, such: [-109.0, 1.0, 58.4, 3.2], w: .3, was: 'Turm über dem Abgrund im Stein der Villenmauer' },
  // ---- Tunnel zum Amt
  { id: 'tunnel_striche', a: 'tunnel', m: 'striche_ritz', s: 1, ray: [605.6, .42, -2600, 0, 0, 1, 2.6], w: .5, was: 'Strichliste in Fünfergruppen, auf Kniehöhe in den Putz gekratzt – wer hier wartete, zählte' },
  { id: 'tunnel_jahre', a: 'tunnel', m: 'jahre_putz', s: 1, ray: [612.4, 1.2, -2600, 0, 0, 1, 2.6], w: .26, rot: -.04, was: '1958, 1975, 1992 – und ein angefangenes „20“ im Putz' },
  // ---- Wald (ab Kap. 6)
  { id: 'wald_stoeck', a: 'wald', m: 'stoeck_rinde', s: 0, op: .95, such: [21, 1.45, 118, 6], w: .32, k: [6, 7], was: 'Stöckchenmann in die Rinde geschnitten, noch hell' },
  { id: 'wald_stoeck2', a: 'wald', m: 'stoeck_rinde2', s: 0, op: .9, such: [-4, 1.35, 133, 6], w: .3, k: [6, 7], was: 'Noch ein Stöckchenmann, älter' },
  { id: 'hochsitz_jahre', a: 'tief', m: 'hoch_holz', s: 0, op: .95, such: [14, 1.3, 175.6, 3.5], w: .24, k: [6, 7], was: 'Jägerstriche am Hochsitz: 75, 92, 09 – auch die Jäger zählen im 17er-Takt' }];
// Kanalstadt (Außenstelle 3, Jonas' „Atlantschiss“): Wände werden beim Betreten von begehbaren Punkten aus gesucht (Kanal-BVH)
const ZEICHEN_KANAL = [
  { id: 'kanal_atlant', m: 'atlant_stein', s: 0, op: .9, w: 1.0, f: .14, was: 'Kinderschrift „ATLANTSCHISS“ mit Krone und Fisch (Jonas’ Kindername für die Kanalstadt)' },
  { id: 'kanal_ast3', m: 'auge_ast3', s: 0, op: .7, w: .45, f: .38, was: 'Schablone: Auge über der Flamme, „AST 3“' },
  { id: 'kanal_striche', m: 'striche_ritz', s: 1, w: .5, f: .62, was: 'Strichliste in Fünfergruppen' },
  { id: 'kanal_laterne', m: 'laterne_alt', s: 1, w: .3, f: .86, was: '1312-Motiv Laterne, sehr alt' }];
// Wandbild: was im Bild versteckt ist → wohin es zeigt (TAUSCH_FUNDE-Kennung). Kein Text im Spiel verrät das.
const ZEICHEN_WAND_HINWEISE = [['∴ im Sand unter der Rutsche', 'k1_rutsche'], ['Rabe auf dem Brunnenrand, etwas Silbernes im Schnabel', 'k1_brunnen'],
  ['Auge im Scheinwerfer des roten Treckers', 'k1_hof'], ['Laterne am Fuß des linken Friedhofspfeilers', 'x7_tor'], ['offenes Gartentor „7“', 'k5_parzelle'], ['der Strahl der zweiten Sonne endet auf der Kreuzung', 'k3_kreuzung']];
const ZEICHEN_WAND = { x: 16.55, z: 50.9, w: 5.8, h: 2.25, d: .32 }; // Mauer neben der Haltestelle Kirchberg (Haltestelle x 7–13), Bild zur Straße (+z)
const zeichen_S = { B: {}, q: [], neu: new Set(), t: 0, tL: 0, tN: 0, blitzT: 0, blitzN: 0, blitzSeen: 0, blitzCam: null, testBlitz: false, atlas: null, mat: null, seen: new Set(),
  luke: [], neuL: [], wand: null, nazca: null, warn: [], ready: false };
const ZU = { uKap: { value: 1 }, uBlitz: { value: 0 } };
const _zv = new THREE.Vector3(), _zv2 = new THREE.Vector3(), _zv3 = new THREE.Vector3(), _zf = new THREE.Vector3(), _zt = new THREE.Vector3(), _zd = new THREE.Vector3(), _zr = new THREE.Ray(), _zm3 = new THREE.Matrix3(), _zm4 = new THREE.Matrix4();
const _zh = { p: new THREE.Vector3(), n: new THREE.Vector3(), d: 0 }, _zh2 = { p: new THREE.Vector3(), n: new THREE.Vector3(), d: 0 };
function zeichen_rng(seed) { let a = seed >>> 0 || 1; return () => (a = (Math.imul(a, 1664525) + 1013904223) >>> 0) / 4294967296; }
function zeichen_cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
// ---------------------------------------------------------------- Formen (Einheitsbox W × H; Striche mit x.lineWidth, Punkte mit fill). Jede Form würfelt mit eigenem Samen → alle Malgänge decken sich.
function zeichen_pfad(x, W, H, pts, R, wob = .005) { x.beginPath(); pts.forEach(([a, b], i) => { const px = W * a, py = H * b;
  if (!i) return x.moveTo(px, py); const [a0, b0] = pts[i - 1]; for (let k = 1; k <= 3; k++) { const f = k / 3, j = k < 3 ? (R() - .5) * wob : 0; x.lineTo(W * (a0 + (a - a0) * f + j), H * (b0 + (b - b0) * f + j)); } }); x.stroke(); }
function zeichen_schrift(x, s, cx, cy, size, font, R, jit = .08) { // Buchstabe für Buchstabe, leicht verdreht – Handarbeit
  x.save(); x.font = `${size}px ${font}`; x.textBaseline = 'middle'; x.textAlign = 'center'; const ch = [...s], ws = ch.map(c => x.measureText(c).width); let px = cx - ws.reduce((a, b) => a + b, 0) / 2;
  ch.forEach((c, i) => { x.save(); x.translate(px + ws[i] / 2, cy + (R() - .5) * size * jit); x.rotate((R() - .5) * jit * 2.4); x.fillText(c, 0, 0); if (x.lineWidth > 1.2) x.strokeText(c, 0, 0); x.restore(); px += ws[i]; }); x.restore(); }
const ZEICHEN_HAND = 'Caveat, "Comic Sans MS", cursive', ZEICHEN_DRUCK = '"Arial Narrow", "Arial", sans-serif', ZEICHEN_DICK = '"Arial Black", Impact, sans-serif';
const ZF = {
  drei: (x, W, H) => { const r = W * .07 + x.lineWidth * .3; for (const [a, b] of [[.5, .28], [.3, .68], [.7, .68]]) { x.beginPath(); x.arc(W * a, H * b, r, 0, 7); x.fill(); } },
  turm: (x, W, H) => { const R = zeichen_rng(3), P = p => zeichen_pfad(x, W, H, p, R);
    P([[.36, .62], [.36, .25], [.4, .25], [.4, .17], [.46, .17], [.46, .25], [.54, .25], [.54, .17], [.6, .17], [.6, .25], [.64, .25], [.64, .62]]);
    P([[.46, .62], [.46, .51]]); x.beginPath(); x.arc(W * .5, H * .51, W * .04, PI, 0); x.stroke(); P([[.54, .51], [.54, .62]]);
    P([[.1, .62], [.9, .63]]); P([[.22, .63], [.31, .72], [.27, .8], [.39, .93]]); P([[.78, .63], [.69, .73], [.74, .82], [.61, .94]]); },
  kreise7: (x, W, H) => { const r = Math.min(H * .27, W * .043); for (let i = 0; i < 8; i++) { x.beginPath(); x.arc(W * (.07 + i * .117), H * .5, r, i < 7 ? 0 : PI * .5, i < 7 ? 7 : PI * 1.5); x.stroke(); } },
  dina: n => (x, W, H) => { for (let i = 0; i < n; i++) { const cx = W * (n === 1 ? .5 : .18 + i * .32), r = Math.min(W / n, H) * .23, cy = H * .64;
    x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke();
    x.beginPath(); x.moveTo(cx, cy + r * .5); x.quadraticCurveTo(cx + r * .45, cy + r * .1, cx, cy - r * .58); x.quadraticCurveTo(cx - r * .45, cy + r * .1, cx, cy + r * .5); x.stroke();
    x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx + r * .05, cy - r * 2.2); x.stroke(); } },
  striche: (n, seed) => (x, W, H) => { const R = zeichen_rng(seed), g = Math.ceil(n / 5), gw = W * .88 / g;
    for (let k = 0; k < g; k++) { const x0 = W * .06 + k * gw, m = Math.min(5, n - k * 5);
      for (let i = 0; i < Math.min(4, m); i++) { const px = (x0 + gw * (.14 + i * .17)) / W; zeichen_pfad(x, W, H, [[px + (R() - .5) * .006, .18 + R() * .08], [px + (R() - .5) * .012, .82 - R() * .08]], R, .004); }
      if (m === 5) zeichen_pfad(x, W, H, [[x0 / W, .72], [(x0 + gw * .74) / W, .3]], R, .004); } },
  auge: (x, W, H) => { const cx = W * .5, cy = H * .5, r = Math.min(W, H) * .42; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke();
    x.beginPath(); x.moveTo(cx - r * .62, cy - r * .22); x.quadraticCurveTo(cx, cy - r * .78, cx + r * .62, cy - r * .22); x.quadraticCurveTo(cx, cy + r * .22, cx - r * .62, cy - r * .22); x.stroke();
    x.beginPath(); x.arc(cx, cy - r * .24, r * .13, 0, 7); x.fill();
    x.beginPath(); x.moveTo(cx, cy + r * .74); x.quadraticCurveTo(cx + r * .32, cy + r * .46, cx, cy + r * .1); x.quadraticCurveTo(cx - r * .32, cy + r * .46, cx, cy + r * .74); x.stroke(); },
  stoeck: seed => (x, W, H) => { const R = zeichen_rng(seed), P = p => zeichen_pfad(x, W, H, p, R, .012), j = () => (R() - .5) * .05;
    P([[.5 + j(), .2], [.5 + j(), .66]]); P([[.22, .37 + j()], [.8, .32 + j()]]); P([[.5, .64], [.32 + j(), .92]]); P([[.5, .64], [.69 + j(), .92]]);
    P([[.43, .21], [.5, .07], [.58, .2], [.43, .21]]); P([[.45, .31], [.55, .38]]); P([[.55, .31], [.45, .38]]); P([[.27, .3], [.2, .44]]); },
  laterne: (x, W, H) => { const R = zeichen_rng(9), P = p => zeichen_pfad(x, W, H, p, R, .008);
    P([[.1, .15], [.88, .25]]); P([[.58, .23], [.58, .35]]); x.beginPath(); x.ellipse(W * .58, H * .57, W * .17, H * .2, 0, 0, 7); x.stroke();
    P([[.44, .41], [.72, .41]]); P([[.44, .73], [.72, .73]]); x.beginPath(); x.moveTo(W * .58, H * .65); x.quadraticCurveTo(W * .63, H * .58, W * .58, H * .49); x.quadraticCurveTo(W * .53, H * .58, W * .58, H * .65); x.stroke(); },
  kind: (x, W, H) => { const R = zeichen_rng(17), P = p => zeichen_pfad(x, W, H, p, R, .02);
    x.beginPath(); x.arc(W * .3, H * .2, W * .075, 0, 7); x.stroke(); P([[.3, .28], [.31, .6]]); P([[.31, .6], [.22, .88]]); P([[.31, .6], [.41, .87]]); P([[.3, .38], [.18, .5]]);
    P([[.3, .37], [.5, .3]]); P([[.5, .3], [.76, .16]]); P([[.74, .17], [.74, .3]]); x.beginPath(); x.arc(W * .74, H * .4, W * .1, 0, 7); x.stroke();
    for (const [a, b] of [[.71, .38], [.77, .38]]) { x.beginPath(); x.arc(W * a, H * b, W * .012 + x.lineWidth * .2, 0, 7); x.fill(); } x.beginPath(); x.arc(W * .74, H * .43, W * .03, .2, PI - .2); x.stroke(); },
  birke: (x, W, H) => { const R = zeichen_rng(13), P = p => zeichen_pfad(x, W, H, p, R, .01);
    P([[.42, .96], [.44, .5], [.47, .08]]); P([[.6, .96], [.57, .5], [.54, .1]]);
    for (let i = 0; i < 7; i++) { const y = .2 + i * .1 + R() * .04, a = .45 + R() * .04; P([[a, y], [a + .06 + R() * .04, y + .01]]); }
    P([[.47, .26], [.3, .14], [.22, .16]]); P([[.53, .3], [.72, .16], [.8, .17]]); P([[.46, .4], [.28, .33]]);
    for (const [a, b] of [[.2, .12], [.28, .1], [.8, .13], [.74, .11], [.26, .3]]) { x.beginPath(); x.arc(W * a, H * b, W * .022, 0, 7); x.stroke(); } },
  herz: (x, W, H) => { x.beginPath(); x.moveTo(W * .5, H * .86); x.bezierCurveTo(W * .04, H * .55, W * .14, H * .06, W * .5, H * .32); x.bezierCurveTo(W * .86, H * .06, W * .96, H * .55, W * .5, H * .86); x.stroke(); },
  text: (s, size, font, seed, dy = .5, jit = .1, dx = .5) => (x, W, H) => { const R = zeichen_rng(seed); x.save(); x.lineWidth *= .4; zeichen_schrift(x, s, W * dx, H * dy, size, font, R, jit); x.restore(); },
  viele: (...f) => (x, W, H) => f.forEach(g => g(x, W, H)),
  teil: (f, a, b, c, d) => (x, W, H) => { x.save(); x.translate(W * a, H * b); f(x, W * c, H * d); x.restore(); } };
// ---------------------------------------------------------------- Malstile: Kreide, Ritzung (frisch/alt; Stein, Rinde, Holz, Putz), Brand, Sprühfarbe, Schablone, Edding, Bleistift, Schimmer (nur Blitz)
const ZEICHEN_RITZ = { stein: ['rgb(188,183,172)', 'rgba(18,16,14,.62)', 'rgb(132,130,118)'], rinde: ['rgb(216,188,134)', 'rgba(38,24,12,.7)', 'rgb(74,58,40)'],
  holz: ['rgb(206,182,144)', 'rgba(30,22,14,.62)', 'rgb(66,54,40)'], putz: ['rgb(204,200,190)', 'rgba(32,30,26,.5)', 'rgb(96,92,84)'] };
function zeichen_tropfen(x, W, H, col, lw, R, n) { if (!n) return; const d = x.getImageData(0, 0, W, H).data, al = (px, py) => d[((Math.min(H - 1, py | 0)) * W + (px | 0)) * 4 + 3];
  x.save(); x.strokeStyle = x.fillStyle = col; x.lineCap = 'round';
  for (let k = 0, t = 0; k < n && t < 600; t++) { const px = 2 + R() * (W - 4), py = 2 + R() * (H - 6); if (al(px, py) < 200 || al(px, py + lw * .7) > 50) continue;
    const L = lw * (1.2 + R() * 5), w = Math.max(1, lw * (.14 + R() * .14)), ey = Math.min(H - 3, py + L); x.globalAlpha = .8; x.lineWidth = w;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + (R() - .5) * 1.2, ey); x.stroke(); x.beginPath(); x.arc(px, ey, w * .85, 0, 7); x.fill(); k++; }
  x.restore(); }
function zeichen_alter(x, W, H, R, k) { // Verwitterung: Abplatzer, Regenschlieren
  x.save(); x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < W * H / 240 * k; i++) { x.fillStyle = `rgba(0,0,0,${.25 + R() * .75})`; const r = .8 + R() * 4.5; x.beginPath(); x.ellipse(R() * W, R() * H, r, r * (.4 + R()), R() * 3, 0, 7); x.fill(); }
  for (let i = 0; i < W / 12 * k; i++) { x.fillStyle = `rgba(0,0,0,${.05 + R() * .14})`; x.fillRect(R() * W, R() * H * .5, 1 + R() * 3, H * (.25 + R() * .75)); }
  x.restore(); }
function zeichen_stil(A, Hc, W, H, form, o) { // zeichnet in die Zelle (A/Hc sind auf die Zelle verschoben)
  const t = zeichen_cv(W, H), x = t.getContext('2d', { willReadFrequently: true }), R = zeichen_rng(o.seed || 11), lw = o.lw || 6, col = o.col || 'rgb(238,235,226)';
  x.lineCap = x.lineJoin = 'round'; let h = null;
  const pass = (st, w, dx = 0, dy = 0, al = 1, blur = 0) => { x.save(); x.translate(dx, dy); x.globalAlpha = al; x.strokeStyle = x.fillStyle = st; x.lineWidth = w; if (blur) x.filter = `blur(${blur}px)`; form(x, W, H); x.restore(); };
  const loch = (n, a0, a1, s0, s1) => { x.save(); x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < n; i++) { x.fillStyle = `rgba(0,0,0,${a0 + R() * (a1 - a0)})`; const s = s0 + R() * (s1 - s0); x.fillRect(R() * W, R() * H, s, s * (.6 + R() * .8)); } x.restore(); };
  const hoehe = (list) => { h = zeichen_cv(W, H); const y = h.getContext('2d'); y.lineCap = y.lineJoin = 'round';
    for (const [st, w, blur] of list) { y.save(); y.strokeStyle = y.fillStyle = st; y.lineWidth = w; if (blur) y.filter = `blur(${blur}px)`; form(y, W, H); y.restore(); } };
  switch (o.art) {
    case 'kreide': for (let k = 0; k < 4; k++) pass(col, lw * (.7 + R() * .45), (R() - .5) * 2.8, (R() - .5) * 2.8, .5); loch(W * H / 12, .25, 1, 1, 2.6); break;
    case 'ritz': { const M = ZEICHEN_RITZ[o.mat || 'stein'], alt = !!o.alt;
      pass(alt ? 'rgba(14,16,12,.5)' : M[1], lw * 1.75, .9, 1.3, 1, alt ? 1.2 : .4); pass(alt ? M[2] : M[0], lw, 0, 0, alt ? .72 : .96, alt ? .7 : 0);
      if (alt) pass('rgba(58,78,36,.4)', lw * .7, .3, .5, 1, 1.4); else pass('rgba(255,250,236,.3)', lw * .32, -.7, -.8);
      loch(W * H / 26, .1, .6, 1, 3); hoehe([['rgb(150,150,150)', lw * 2, alt ? 2 : 1], [alt ? 'rgb(80,80,80)' : 'rgb(28,28,28)', lw * 1.05, alt ? 1.8 : .6]]); break; }
    case 'brand': x.save(); x.shadowColor = 'rgba(92,52,20,.85)'; x.shadowBlur = lw * 1.6; pass('rgba(70,40,18,.5)', lw * 1.8); x.restore();
      pass('rgba(16,11,8,.94)', lw); pass('rgba(46,28,14,.55)', lw * .45, .6, .4); loch(W * H / 20, .2, .8, 1, 2.2); hoehe([['rgb(96,96,96)', lw * 1.15, 1.2]]); break;
    case 'spray': x.save(); x.shadowColor = col; x.shadowBlur = lw * .9; pass(col, lw, 0, 0, .5); x.restore(); pass(col, lw * .86, 0, 0, .96);
      zeichen_tropfen(x, W, H, col, lw, R, o.tropf ?? 6); zeichen_alter(x, W, H, R, o.alter ?? .5); break;
    case 'schab': pass(col, lw, 0, 0, .92); x.save(); x.globalCompositeOperation = 'destination-out'; x.strokeStyle = '#000'; x.lineWidth = Math.max(2, lw * .24);
      for (let i = 0; i < 4; i++) { const xx = W * (.18 + R() * .64); x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx + (R() - .5) * 8, H); x.stroke(); } x.restore();
      x.save(); x.globalCompositeOperation = 'destination-over'; x.globalAlpha = .1; x.fillStyle = col; x.filter = 'blur(7px)'; x.fillRect(W * .08, H * .08, W * .84, H * .84); x.restore();
      zeichen_alter(x, W, H, R, o.alter ?? .9); break;
    case 'marker': pass(col, lw * 1.3, 0, 0, .14, 1); pass(col, lw, 0, 0, .95, .25); zeichen_alter(x, W, H, R, o.alter ?? .25); break;
    case 'blei': pass('rgba(56,56,60,.85)', lw); pass('rgba(150,150,160,.25)', lw * .4, -.4, -.4); loch(W * H / 7, .2, .7, 1, 1.6); break;
    case 'schimmer': x.save(); x.shadowColor = 'rgba(205,224,255,.9)'; x.shadowBlur = lw * 1.5; pass('rgba(228,236,255,.86)', lw); x.restore();
      pass('rgba(236,244,255,.32)', lw * 1.7, 1.5, 2.5, 1, 2.5); loch(W * H / 16, .2, .9, 1, 2.4); break; }
  A.drawImage(t, 0, 0); if (h) Hc.drawImage(h, 0, 0); return !!h;
}
// ---------------------------------------------------------------- Graffiti (Jugend im Ort: Alltag und Zeichen gemischt)
function zeichen_piece(A, W, H, s, o) { const t = zeichen_cv(W, H), x = t.getContext('2d', { willReadFrequently: true }), R = zeichen_rng(o.seed || 5);
  x.translate(o.x, o.y); x.rotate(o.rot || 0); x.font = `${o.size}px ${o.font || ZEICHEN_DICK}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  x.save(); x.shadowColor = o.fill; x.shadowBlur = o.size * .12; x.globalAlpha = .35; x.fillStyle = o.fill; x.fillText(s, 0, 0); x.restore();
  x.strokeStyle = o.line || '#151515'; x.lineWidth = o.size * .17; x.strokeText(s, 0, 0); x.fillStyle = o.fill; x.fillText(s, 0, 0);
  if (o.glanz) { x.save(); x.globalCompositeOperation = 'source-atop'; const g = x.createLinearGradient(0, -o.size * .5, 0, o.size * .5); g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(.42, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.3)'); x.fillStyle = g; x.fillRect(-W, -o.size, W * 2, o.size * 2); x.restore(); }
  x.setTransform(1, 0, 0, 1, 0, 0); zeichen_tropfen(x, W, H, o.fill, o.size * .1, R, o.tropf ?? 7); zeichen_alter(x, W, H, R, o.alter ?? .5); A.drawImage(t, 0, 0); }
const zeichen_sub = (A, Hc, x0, y0, W, H, f, o) => { A.save(); Hc.save(); A.translate(x0, y0); Hc.translate(x0, y0); zeichen_stil(A, Hc, W, H, f, o); A.restore(); Hc.restore(); };
const ZEICHEN_UFO = (x, W, H) => { x.beginPath(); x.ellipse(W * .5, H * .5, W * .3, H * .11, 0, 0, 7); x.stroke(); x.beginPath(); x.arc(W * .5, H * .45, W * .12, PI, 0); x.stroke();
  for (const a of [-.2, 0, .2]) { x.beginPath(); x.moveTo(W * (.5 + a * .6), H * .62); x.lineTo(W * (.5 + a * 1.4), H * .92); x.stroke(); } };
const ZEICHEN_GEIST = (x, W, H) => { x.beginPath(); x.moveTo(W * .25, H * .9); x.lineTo(W * .25, H * .4); x.bezierCurveTo(W * .25, H * .05, W * .75, H * .05, W * .75, H * .4); x.lineTo(W * .75, H * .9);
  for (let i = 0; i < 4; i++) x.quadraticCurveTo(W * (.69 - i * .125), H * (i % 2 ? .98 : .8), W * (.625 - i * .125), H * .9); x.stroke();
  for (const a of [.41, .59]) { x.beginPath(); x.arc(W * a, H * .42, W * .04 + x.lineWidth * .2, 0, 7); x.fill(); } };
function zeichen_gNr9(A, Hc, W, H) {
  zeichen_sub(A, Hc, 30, 20, 300, 110, ZF.text('LE 2011', 70, ZEICHEN_DICK, 41), { art: 'spray', col: 'rgba(120,124,126,1)', lw: 9, alter: 1.4, tropf: 2 }); // alter Tag, fast weg
  zeichen_piece(A, W, H, 'SCHIMMEL', { x: W * .5, y: H * .34, size: 92, rot: -.06, fill: '#c9cac4', glanz: true, seed: 3 });
  zeichen_sub(A, Hc, 40, 250, 200, 180, ZF.herz, { art: 'spray', col: 'rgba(186,28,36,1)', lw: 11, tropf: 5, seed: 7 });
  zeichen_sub(A, Hc, 80, 300, 120, 80, ZF.text('J + K', 40, ZEICHEN_HAND, 8), { art: 'marker', col: 'rgba(20,20,22,1)', lw: 4 });
  zeichen_sub(A, Hc, 270, 280, 220, 70, ZF.text('NIX WIE WEG', 44, ZEICHEN_HAND, 9, .5, .14), { art: 'marker', col: 'rgba(24,24,26,1)', lw: 4 });
  zeichen_sub(A, Hc, 380, 360, 60, 60, ZF.drei, { art: 'marker', col: 'rgba(18,18,20,1)', lw: 2 }); // klein dazwischen gesetzt, andere Hand
  zeichen_sub(A, Hc, 250, 390, 180, 80, ZF.text('Abi 09 ♥', 34, ZEICHEN_HAND, 10, .5, .1), { art: 'marker', col: 'rgba(40,70,150,1)', lw: 3, alter: .6 }); }
function zeichen_gTanke(A, Hc, W, H) {
  const rot = 'rgba(178,30,30,1)';
  zeichen_sub(A, Hc, 60, 30, 300, 300, ZEICHEN_UFO, { art: 'spray', col: 'rgba(24,24,24,1)', lw: 8, tropf: 4, seed: 4 });
  zeichen_sub(A, Hc, 60, 30, 300, 300, (x, w, h) => { x.beginPath(); x.arc(w * .5, h * .5, w * .44, 0, 7); x.stroke(); x.beginPath(); x.moveTo(w * .19, h * .19); x.lineTo(w * .81, h * .81); x.stroke(); }, { art: 'spray', col: rot, lw: 12, tropf: 3, seed: 6 });
  zeichen_sub(A, Hc, 10, 330, 380, 80, ZF.text('HIER LANDEN VERBOTEN', 46, ZEICHEN_DICK, 12, .5, .06), { art: 'spray', col: rot, lw: 4, tropf: 5, alter: .6 });
  zeichen_sub(A, Hc, 330, 60, 170, 170, ZF.auge, { art: 'spray', col: 'rgba(22,22,22,1)', lw: 6, tropf: 3, alter: .9 }); // abgemalt
  zeichen_sub(A, Hc, 440, 160, 60, 90, ZF.text('?', 80, ZEICHEN_HAND, 13), { art: 'spray', col: 'rgba(22,22,22,1)', lw: 3, tropf: 2 });
  zeichen_sub(A, Hc, 300, 400, 210, 100, ZF.text('KEVIN ♥ JULE', 40, ZEICHEN_HAND, 14), { art: 'marker', col: 'rgba(200,60,140,1)', lw: 4 });
  zeichen_piece(A, W, H, 'NIEMANDSLAND', { x: W * .3, y: H * .93, size: 44, rot: .02, fill: '#5e8f4c', seed: 15, alter: .9, tropf: 3 }); }
function zeichen_gVilla(A, Hc, W, H) {
  zeichen_piece(A, W, H, 'SPUKHAUS', { x: W * .38, y: H * .32, size: 84, rot: -.04, fill: '#e6e2d6', line: '#2a2a2a', seed: 21, tropf: 9 });
  zeichen_sub(A, Hc, 400, 20, 110, 130, ZEICHEN_GEIST, { art: 'spray', col: 'rgba(232,230,222,1)', lw: 6, tropf: 3 });
  zeichen_sub(A, Hc, 30, 150, 300, 60, ZF.text('TIM WAR DRIN 2014', 36, ZEICHEN_HAND, 22), { art: 'marker', col: 'rgba(20,20,22,1)', lw: 4 });
  zeichen_sub(A, Hc, 300, 190, 180, 60, ZF.text('LÜGNER', 40, ZEICHEN_HAND, 23, .5, .2), { art: 'marker', col: 'rgba(150,26,26,1)', lw: 4, alter: .15 }); }
function zeichen_aufkleber(A, Hc, W, H) { const x = A, R = zeichen_rng(31); x.save(); x.translate(W / 2, H / 2); x.rotate(-.05);
  const w = W * .82, h = H * .58; x.fillStyle = '#e9e7df'; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 10); x.fill();
  x.fillStyle = '#141414'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `bold ${H * .2}px ${ZEICHEN_DICK}`; x.fillText('ICH WAR', W * .07, -h * .2); x.fillText('DRIN', W * .07, h * .2);
  x.strokeStyle = '#141414'; x.lineWidth = 3; x.save(); x.translate(-w * .36, 0); x.beginPath(); x.ellipse(0, 4, 22, 8, 0, 0, 7); x.stroke(); x.beginPath(); x.arc(0, 0, 10, PI, 0); x.stroke();
  x.beginPath(); x.moveTo(-8, 14); x.lineTo(-14, 34); x.moveTo(8, 14); x.lineTo(14, 34); x.stroke(); x.restore();
  x.fillStyle = 'rgba(160,156,146,.9)'; x.beginPath(); x.moveTo(w / 2, -h / 2 + 34); x.lineTo(w / 2 - 34, -h / 2); x.lineTo(w / 2, -h / 2); x.closePath(); x.globalCompositeOperation = 'destination-out'; x.fill();
  x.globalCompositeOperation = 'source-over'; x.fillStyle = 'rgba(200,196,186,1)'; x.beginPath(); x.moveTo(w / 2, -h / 2 + 34); x.lineTo(w / 2 - 34, -h / 2); x.lineTo(w / 2 - 22, -h / 2 + 24); x.closePath(); x.fill();
  x.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(${R() < .5 ? '255,255,255' : '60,56,50'},${.15 + R() * .3})`; x.lineWidth = .8; x.beginPath(); const a = (R() - .5) * w, b = (R() - .5) * h; x.moveTo(a, b); x.lineTo(a + (R() - .5) * 40, b + (R() - .5) * 8); x.stroke(); }
  x.fillStyle = 'rgba(90,80,60,.18)'; x.fillRect(-w / 2, h * .1, w, h * .4); x.restore(); }
// ---------------------------------------------------------------- Atlas: [Spalten, Zeilen (je 256 px), Malfunktion]
const ZEICHEN_MOTIVE = {
  drei_stein: [1, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.drei, { art: 'ritz', mat: 'stein', lw: 4, alt: true })],
  auge_schab: [1, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.auge, { art: 'schab', col: 'rgba(26,26,30,1)', lw: 11 })],
  aufkleber: [1, 1, (A, Hc, W, H) => zeichen_aufkleber(A, Hc, W, H)],
  g_nr9: [2, 2, (A, Hc, W, H) => zeichen_gNr9(A, Hc, W, H)],
  striche_blei: [2, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.striche(23, 5), { art: 'blei', lw: 2.6 })],
  dina_kreide: [2, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.dina(3), { art: 'kreide', lw: 7, seed: 3 })],
  komme_kreide: [4, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.viele(ZF.text('ICH KOMME', 150, ZEICHEN_HAND, 33, .4, .16),
    (x, w, h) => { const R = zeichen_rng(34); for (let i = 0; i < 17; i++) zeichen_pfad(x, w, h, [[.16 + i * .04 + (R() - .5) * .006, .76 + R() * .03], [.16 + i * .04 + (R() - .5) * .012, .94 - R() * .03]], R, .004); }), { art: 'kreide', lw: 9, seed: 5 })],
  kreise7_schimmer: [2, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.kreise7, { art: 'schimmer', lw: 6 })],
  g_tanke: [2, 2, (A, Hc, W, H) => zeichen_gTanke(A, Hc, W, H)],
  turm_alt: [1, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.turm, { art: 'ritz', mat: 'stein', lw: 6, alt: true })],
  birke_alt: [1, 2, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.birke, { art: 'ritz', mat: 'stein', lw: 6, alt: true })],
  laterne_alt: [1, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.laterne, { art: 'ritz', mat: 'stein', lw: 6, alt: true })],
  jahre_holz: [1, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.viele(...['1958', '1975', '1992', '2009'].map((s, i) => ZF.text(s, 52, ZEICHEN_DRUCK, 40 + i, .14 + i * .19, .12))), { art: 'ritz', mat: 'holz', lw: 4 })],
  kind_kreide: [1, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.kind, { art: 'kreide', lw: 7, seed: 8 })],
  kreise7_holz: [2, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.kreise7, { art: 'ritz', mat: 'holz', lw: 4 })],
  kreise7_brand: [2, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.kreise7, { art: 'brand', lw: 8 })],
  dina_schimmer: [1, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.dina(1), { art: 'schimmer', lw: 7 })],
  g_villa: [2, 1, (A, Hc, W, H) => zeichen_gVilla(A, Hc, W, H)],
  striche_ritz: [2, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.striche(19, 9), { art: 'ritz', mat: 'putz', lw: 3.2 })],
  jahre_putz: [1, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.viele(...['1958', '1975', '1992', '20'].map((s, i) => ZF.text(s, 50, ZEICHEN_DRUCK, 50 + i, .14 + i * .2, .1, i === 3 ? .4 : .5))), { art: 'ritz', mat: 'putz', lw: 3.4 })],
  atlant_stein: [2, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.viele(ZF.text('ATLANTSCHISS', 66, ZEICHEN_HAND, 60, .62, .2),
    (x, w, h) => zeichen_pfad(x, w, h, [[.1, .34], [.12, .14], [.16, .26], [.19, .1], [.22, .26], [.26, .14], [.28, .34], [.1, .34]], zeichen_rng(61), .01),
    (x, w, h) => { x.beginPath(); x.ellipse(w * .88, h * .3, w * .05, h * .1, 0, 0, 7); x.stroke(); zeichen_pfad(x, w, h, [[.93, .3], [.97, .2], [.97, .4], [.93, .3]], zeichen_rng(62)); }), { art: 'ritz', mat: 'stein', lw: 4 })],
  auge_ast3: [1, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.viele(ZF.teil(ZF.auge, .15, 0, .7, .7), ZF.text('AST 3', 54, ZEICHEN_DICK, 70, .86, .02)), { art: 'schab', col: 'rgba(30,30,30,1)', lw: 9 })],
  stoeck_rinde: [1, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.stoeck(5), { art: 'ritz', mat: 'rinde', lw: 5 })],
  stoeck_rinde2: [1, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.stoeck(8), { art: 'ritz', mat: 'rinde', lw: 4.5, alt: true })],
  hoch_holz: [1, 1, (A, Hc, W, H) => zeichen_stil(A, Hc, W, H, ZF.viele(...['75', '92', '09'].map((s, i) => ZF.teil(ZF.viele(ZF.text(s, 50, ZEICHEN_DRUCK, 80 + i, .5, .1, .2), ZF.teil(ZF.striche(3 + i * 4, 90 + i), .38, .1, .62, .8)), 0, .05 + i * .31, 1, .3))), { art: 'ritz', mat: 'holz', lw: 3.6 })] };
// Nutzer 02.10.: „Graffiti sind selbst gezeichnet – realistisch, AAA“. Die drei Graffiti-Wände sind eigene Bilder (2048 x 1024 = 2,4 x 1,2 m, offline erzeugt):
//   echte, aus Fotoscans freigestellte Tags/Sprühfarbe (Fab „Red Graffiti Wall Scan“ commonspence, „Graffitis en apeadero“, beide CC-BY) + Story-Schriftzüge,
//   gesprüht entlang einer Handschrift (Kern, Sprühnebel aus Tröpfchen, Läufer, Farbkorn aus dem Betonscan). Übrige Sprüh-Motive im Atlas bekommen Korn und Poren.
const ZEICHEN_BILD = { g_nr9: 'wand_nr9.png', g_tanke: 'wand_tanke.png', g_villa: 'wand_villa.png', g_alien: 'wand_alien.png', g_zaehl: 'wand_zaehl.png', g_sumpfgas: 'wand_sumpfgas.png', g_auge: 'wand_auge.png', g_abholung: 'wand_abholung.png', g_umdrehen: 'wand_umdrehen.png', k_zaehlen: 'boden_kreide17.png' };
function zeichen_bild(src) { return new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = 'assets/ms/graffiti_echt/' + src; setTimeout(() => r(null), 6000); }); }
function zeichen_echt(a, W, H, k, Z) { if (!Z || !Z.korn) return;
  a.save(); a.globalCompositeOperation = 'source-atop'; a.globalAlpha = .24; for (let yy = 0; yy < H; yy += 512) for (let xx = 0; xx < W; xx += 512) a.drawImage(Z.korn, xx, yy, 512, 512); a.restore(); // Farbkorn
  if (Z.poren) { a.save(); a.globalCompositeOperation = 'destination-out'; a.globalAlpha = .85; for (let yy = 0; yy < H; yy += 384) for (let xx = 0; xx < W; xx += 384) a.drawImage(Z.poren, xx, yy, 384, 384); a.restore(); } } // Poren, Risse
async function zeichen_atlas() {
  try { await Promise.race([document.fonts.load('80px Caveat'), wait(1500)]); } catch (e) {}
  const ZE = {}; try { const L = ['korn.jpg', 'poren.png']; const B = await Promise.all(L.map(zeichen_bild)); L.forEach((n, i) => { ZE[n.replace(/\..*$/, '')] = B[i]; }); } catch (e) { console.warn('Zeichen: echte Graffiti', e); }
  const N = 2048, G = 256, A = zeichen_cv(N, N), Hc = zeichen_cv(N, N), a = A.getContext('2d'), hx = Hc.getContext('2d', { willReadFrequently: true });
  hx.fillStyle = 'rgb(128,128,128)'; hx.fillRect(0, 0, N, N); const frei = Array.from({ length: 8 }, () => Array(8).fill(true)), cells = {}, nrmRects = [];
  for (const [k, [gw, gh, mal]] of Object.entries(ZEICHEN_MOTIVE)) { if (ZEICHEN_BILD[k]) continue;
    let at = null; for (let r = 0; r + gh <= 8 && !at; r++) for (let c = 0; c + gw <= 8 && !at; c++) { let ok = true; for (let i = 0; i < gh; i++) for (let j = 0; j < gw; j++) if (!frei[r + i][c + j]) ok = false; if (ok) at = [c, r]; }
    if (!at) { console.warn('Zeichen: Atlas voll', k); continue; } for (let i = 0; i < gh; i++) for (let j = 0; j < gw; j++) frei[at[1] + i][at[0] + j] = false;
    const px = at[0] * G, py = at[1] * G, W = gw * G - 12, H = gh * G - 12; // 6 px Rand gegen Überlaufen der Mip-Stufen
    a.save(); hx.save(); a.translate(px + 6, py + 6); hx.translate(px + 6, py + 6); a.beginPath(); a.rect(0, 0, W, H); a.clip(); hx.beginPath(); hx.rect(0, 0, W, H); hx.clip();
    try { if (mal(a, hx, W, H)) nrmRects.push([px, py, gw * G, gh * G]); if (/spray|auge_schab|ufo/i.test(k)) zeichen_echt(a, W, H, k, ZE); } catch (e) { console.warn('Zeichen: Motiv', k, e); } a.restore(); hx.restore();
    cells[k] = { u0: (px + 6) / N, u1: (px + 6 + W) / N, v0: 1 - (py + 6 + H) / N, v1: 1 - (py + 6) / N, ah: H / W }; }
  // Normal-Map nur dort rechnen, wo es Höhe gibt (Ritzungen, Brand); sonst flach
  const nc = zeichen_cv(N, N), nx = nc.getContext('2d'); nx.fillStyle = 'rgb(128,128,255)'; nx.fillRect(0, 0, N, N);
  for (const [px, py, w, h] of nrmRects) { const src = hx.getImageData(px, py, w, h).data, img = nx.createImageData(w, h), d = img.data, Hh = (i, j) => src[(Math.max(0, Math.min(h - 1, j)) * w + Math.max(0, Math.min(w - 1, i))) * 4] / 255;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const gx = Hh(i + 1, j) - Hh(i - 1, j), gy = Hh(i, j + 1) - Hh(i, j - 1), s = 5, vx = -gx * s, vy = gy * s, l = Math.hypot(vx, vy, 1), o = (j * w + i) * 4;
      d[o] = (vx / l * .5 + .5) * 255; d[o + 1] = (vy / l * .5 + .5) * 255; d[o + 2] = (1 / l * .5 + .5) * 255; d[o + 3] = 255; }
    nx.putImageData(img, px, py); }
  const map = new THREE.CanvasTexture(A); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8; const nrm = new THREE.CanvasTexture(nc); nrm.anisotropy = 8;
  return { map, nrm, cells, canvas: A };
}
// ---------------------------------------------------------------- Material: Sichtbarkeit im Shader (Kapitel, Streiflicht, Blitz, Kreide-Alter)
function zeichen_material(atlas) {
  const m = new THREE.MeshStandardMaterial({ map: atlas.map, normalMap: atlas.nrm, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, roughness: .86, metalness: 0, envMapIntensity: .3 });
  m.normalScale.set(1.2, 1.2);
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, ZU); sh.uniforms.flP = fogUniforms.flP; sh.uniforms.flD = fogUniforms.flD; sh.uniforms.flK = fogUniforms.flK;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 zInfo;\nattribute float zShow;\nvarying vec4 vZI;\nvarying float vZS;\nvarying vec3 vZW;\nvarying vec3 vZN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvZI = zInfo; vZS = zShow; vZW = position; vZN = normal;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uKap; uniform float uBlitz; uniform vec3 flP; uniform vec3 flD; uniform vec2 flK;\nvarying vec4 vZI;\nvarying float vZS;\nvarying vec3 vZW;\nvarying vec3 vZN;')
      .replace('#include <alphamap_fragment>', `#include <alphamap_fragment>
      float zA = vZI.w * vZS; float zm = vZI.x;
      if (uKap < vZI.y - .5 || uKap > vZI.z + .5) zA = 0.;
      if (zm > .5 && zm < 1.5) { vec3 zL = vZW - flP; float zd = length(zL); zL /= max(zd, 1e-3);
        float zc = smoothstep(flK.y - .015, flK.y + .06, dot(zL, flD)) * clamp(flK.x, 0., 1.4) * (1. - smoothstep(5., 13., zd));
        float zg = 1. - abs(dot(normalize(vZN), zL)); zA *= clamp(zc * mix(.12, 1.3, smoothstep(.25, .85, zg)), 0., 1.); }
      else if (zm > 1.5 && zm < 2.5) zA *= uBlitz;
      else if (zm > 2.5) zA = max(zA * pow(.55, max(0., uKap - vZI.y)), vZI.w * vZS * uBlitz);
      diffuseColor.a *= zA; if (diffuseColor.a < .004) discard;`); };
  m.customProgramCacheKey = () => 'zeichen1'; return m;
}
function zeichen_vorRender(r, sc, cam) { const rt = r.getRenderTarget(), b = zeichen_S.testBlitz || (rt && typeof kamera_S !== 'undefined' && rt === kamera_S.rt) ? 1 : 0; ZU.uBlitz.value = b;
  if (b && !zeichen_S.testBlitz) { const now = performance.now(); if (now - zeichen_S.blitzT > 600) { zeichen_S.blitzT = now; zeichen_S.blitzN++; zeichen_S.blitzCam = cam; } } }
// ---------------------------------------------------------------- Strahlen gegen die Kollisions-BVH der Basis (SOL) bzw. die Kanal-BVH
function zeichen_ray(o, d, far, out) {
  if (zeichen_S.imKanal) { const h = typeof canalHit === 'function' ? canalHit(o.x, o.y, o.z, d.x, d.y, d.z, far) : null; if (!h || !h.face) return null;
    out.p.copy(h.point); out.n.copy(h.face.normal); if (out.n.dot(d) > 0) out.n.negate(); out.d = h.distance; return out; }
  let best = far, hit = false; const seen = zeichen_S.seen; seen.clear();
  for (let t = 0; t <= far + .7; t += .7) { const list = solidNear(o.x + d.x * Math.min(t, far), o.z + d.z * Math.min(t, far));
    for (const it of list) { if (seen.has(it)) continue; seen.add(it); if (it.soft || !solidLive(it)) continue;
      _zr.origin.copy(o); _zr.direction.copy(d); if (!_zr.intersectsBox(it.bb)) continue;
      _zr.origin.applyMatrix4(it.inv); _zr.direction.transformDirection(it.inv);
      const h = it.o.geometry.boundsTree.raycastFirst(_zr, THREE.DoubleSide); if (!h) continue;
      _zv3.copy(h.point).applyMatrix4(it.mw); const dist = _zv3.distanceTo(o); if (dist > best) continue;
      best = dist; hit = true; out.p.copy(_zv3); out.n.copy(h.face.normal).applyMatrix3(_zm3.getNormalMatrix(it.mw)).normalize(); } }
  if (!hit) return null; if (out.n.dot(d) > 0) out.n.negate(); out.d = best; return out;
}
function zeichen_such(o, r, out) { let ok = false, bd = 1e9; // nächste senkrechte Fläche rund um o
  for (let a = 0; a < 24; a++) { const g = a / 24 * PI * 2; _zd.set(Math.cos(g), 0, Math.sin(g)); if (zeichen_ray(o, _zd, r, _zh2) && Math.abs(_zh2.n.y) < .4 && _zh2.d < bd && _zh2.d > .05) { bd = _zh2.d; out.p.copy(_zh2.p); out.n.copy(_zh2.n); ok = true; } }
  return ok; }
function zeichen_lampe(x, z) { let best = null, bd = 1e9; for (const L of (typeof lamps !== 'undefined' ? lamps : [])) { if (L.nord || !L.g) continue; const d = Math.hypot(L.g.position.x - x, L.g.position.z - z); if (d < bd) { bd = d; best = L; } } return bd < 25 ? best : null; }
function zeichen_boden(x, z) { let g = -Infinity; try { g = solidGround(x, .8, z); } catch (e) {} return g > -1 ? Math.max(0, g) : 0; }
// ---------------------------------------------------------------- Platzieren: Rahmen aus Treffer + Normale, Gitter schmiegt sich per Strahl an (Rinde, Stein, Bretter)
function zeichen_platz(B, d) {
  const bild = zeichen_S.bilder && zeichen_S.bilder[d.m], cell = bild ? { u0: 0, u1: 1, v0: 0, v1: 1, ah: bild.ah } : zeichen_S.atlas.cells[d.m]; if (!cell) return false;
  if (bild) B = { pos: [], nrm: [], uv: [], info: [], show: [], idx: [] }; // eigenes Netz mit eigenem Bild
  const w = d.w, h = d.h || d.w * cell.ah, P = new THREE.Vector3(), N = new THREE.Vector3(), U = new THREE.Vector3(), V = new THREE.Vector3(); let anschmiegen = true;
  if (d.boden) { const [bx, bz, yaw] = d.boden; P.set(bx, zeichen_boden(bx, bz) + .03, bz); N.set(0, 1, 0); V.set(-Math.sin(yaw), 0, -Math.cos(yaw)); anschmiegen = false; }
  else { let ok = false;
    if (d.ray) { _zf.set(d.ray[3], d.ray[4], d.ray[5]).normalize(); for (const [ox, oz] of _zf.y < -.5 ? [[0, 0], [0, .12], [0, -.12], [.15, 0], [-.15, 0], [0, .24], [0, -.24]] : [[0, 0]]) { _zv.set(d.ray[0] + ox, d.ray[1], d.ray[2] + oz); if ((ok = !!zeichen_ray(_zv, _zf, d.ray[6], _zh))) break; } }
    else if (d.lampe) { const L = zeichen_lampe(d.lampe[0], d.lampe[1]); if (L) { const lx = L.g.position.x, lz = L.g.position.z; _zv.set(lx, 1.45, lz + (lz > 0 ? -.9 : .9)); ok = zeichen_such(_zv, 1.6, _zh); } }
    else if (d.such) { _zv.set(d.such[0], d.such[1], d.such[2]); ok = zeichen_such(_zv, d.such[3], _zh); }
    if (!ok) return false; P.copy(_zh.p); N.copy(_zh.n); if (Math.abs(N.y) > .8) V.set(0, 0, -1); else V.set(0, 1, 0); }
  U.crossVectors(V, N).normalize(); V.crossVectors(N, U).normalize();
  if (d.rot) { const c = Math.cos(d.rot), s = Math.sin(d.rot); _zt.copy(U); U.multiplyScalar(c).addScaledVector(V, s); V.multiplyScalar(c).addScaledVector(_zt, -s); }
  const cols = Math.max(1, Math.min(8, Math.ceil(w / .12))), rows = Math.max(1, Math.min(6, Math.ceil(h / .16))), base = B.pos.length / 3, k = d.k || [1, 7], show = d.neu && !zeichen_S.neu.has(d.id) ? 0 : 1;
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
    _zv.copy(P).addScaledVector(U, (i / cols - .5) * w).addScaledVector(V, (j / rows - .5) * h); let n = N;
    if (anschmiegen) { _zv2.copy(_zv).addScaledVector(N, .3); _zd.copy(N).negate(); if (zeichen_ray(_zv2, _zd, .62, _zh2) && _zh2.n.dot(N) > .3) { _zv.copy(_zh2.p); n = _zh2.n; } }
    _zv.addScaledVector(n, .006);
    B.pos.push(_zv.x, _zv.y, _zv.z); B.nrm.push(n.x, n.y, n.z); B.uv.push(cell.u0 + (cell.u1 - cell.u0) * i / cols, cell.v0 + (cell.v1 - cell.v0) * j / rows); B.info.push(d.s, k[0], k[1], d.op ?? 1); B.show.push(show); }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = base + j * (cols + 1) + i; B.idx.push(a, a + 1, a + cols + 2, a, a + cols + 2, a + cols + 1); }
  if (bild) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nrm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2)); g.setIndex(B.idx); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, bild.mat); m.renderOrder = 3; m.receiveShadow = true; m.userData.noCol = true; m.matrixAutoUpdate = false; scene.add(m); B.mesh = m; B.showA = null; (zeichen_S.bildM = zeichen_S.bildM || []).push([m, k]); }
  else B.neu = true; d.P = P; d.N = N; d.v0 = base; d.vn = (cols + 1) * (rows + 1); d.B = B; d.ok = true;
  if (d.luke && !d.nurNeu) zeichen_S.luke.push(d); if (d.neu) zeichen_S.neuL.push(d); return true;
}
function zeichen_mesh(B) { // ein Mesh je Bereich (ein Zeichenaufruf); die kleine Geometrie wird nach jedem neu gesetzten Zeichen frisch gebaut (selten, wenige hundert Ecken)
  const m = new THREE.Mesh(new THREE.BufferGeometry(), zeichen_S.mat); m.renderOrder = 3; m.receiveShadow = true; m.castShadow = false; m.userData.noCol = true; m.matrixAutoUpdate = false; m.onBeforeRender = zeichen_vorRender; m.visible = false;
  scene.add(m); Object.assign(B, { mesh: m, showA: null, pos: [], nrm: [], uv: [], info: [], show: [], idx: [], neu: false });
}
function zeichen_geo(B) { B.neu = false; if (!B.idx.length) return; const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nrm, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
  g.setAttribute('zInfo', new THREE.Float32BufferAttribute(B.info, 4)); const sh = new THREE.Float32BufferAttribute(B.show, 1); g.setAttribute('zShow', sh); g.setIndex(B.idx); g.computeBoundingSphere();
  const alt = B.mesh.geometry; B.mesh.geometry = g; alt.dispose(); B.showA = sh; B.mesh.visible = true; }
function zeichen_zeig(d, v) { if (!d.ok) return; const B = d.B; for (let i = 0; i < d.vn; i++) B.show[d.v0 + i] = v; if (B.showA) { for (let i = 0; i < d.vn; i++) B.showA.setX(d.v0 + i, v); B.showA.needsUpdate = true; } }
function zeichen_showSync() { for (const d of zeichen_S.neuL) zeichen_zeig(d, zeichen_S.neu.has(d.id) ? 1 : 0); }
// ---------------------------------------------------------------- Bereiche: erst beim Annähern bauen (zwei Zeichen je Bild)
function zeichen_bereiche() { // Bereich (Mesh) beim ersten Annähern; jedes Zeichen erst auf 38 m (dann sind die Kulissen der anderen Module eingeblendet)
  const S = zeichen_S, P = player.pos, K = typeof kap === 'function' ? kap() : 1, now = performance.now();
  for (const [id, A] of Object.entries(ZEICHEN_ORTE)) { if (A.k && K < A.k) continue;
    if (!S.B[id]) { if (A.kanal) { if (state.zone !== 'canal' || typeof canal === 'undefined' || !canal.colMesh || !canal.points || canal.points.length < 40) continue; }
      else if (Math.hypot(P.x - A.x, P.z - A.z) > A.r) continue;
      const B = S.B[id] = { id, list: [], kanal: !!A.kanal };
      if (A.kanal) { const pts = canal.points; for (const e of ZEICHEN_KANAL) { const p = pts[Math.min(pts.length - 1, Math.floor(pts.length * e.f))]; B.list.push(Object.assign({}, e, { a: id, kp: p })); } }
      else for (const e of ZEICHEN_TAB) if (e.a === id) { const a = e.ray || e.such || e.lampe || e.boden; B.list.push(Object.assign({}, e, { ax: a[0], az: e.ray || e.such ? a[2] : a[1] })); }
      zeichen_mesh(B); }
    const B = S.B[id]; if (B.kanal && state.zone !== 'canal') continue;
    for (const d of B.list) { if (d.ok || d.wartet || (d.tries || 0) >= 3 || now < (d.next || 0)) continue;
      if (!B.kanal && Math.hypot(P.x - d.ax, P.z - d.az) > 38) continue; d.wartet = true; S.q.push([B, d]); } }
}
function zeichen_kanalPlatz(B, d) { // von begehbaren Punkten der Kanalstadt aus die nächste Wand suchen (bis zu 6 Punkte weiter)
  const pts = canal.points, i0 = pts.indexOf(d.kp); zeichen_S.imKanal = true;
  try { for (let k = 0; k < 6; k++) { const p = pts[(i0 + k * 7) % pts.length]; _zv.set(p.x, p.y + (d.s === 1 ? .9 : 1.35), p.z); if (zeichen_such(_zv, 2.4, _zh)) { d.such = [_zv.x, _zv.y, _zv.z, 2.4]; return zeichen_platz(B, d); } } return false; }
  finally { zeichen_S.imKanal = false; } }
// ---------------------------------------------------------------- Wandbild „Unser Dorf“ (GTA-V-Prinzip): Mauer beim Laden (exakte Kollision), Bild erst beim Annähern gemalt
function zeichen_wandMauer() {
  const Wd = ZEICHEN_WAND, pm = msSurfMat('wall_plaster', { tint: 0xd2c9b7 }); pm.userData.tile = 2; const cm = msSurfMat('facade_concrete', { tint: 0x8a867c }); cm.userData.tile = 1.5;
  const m = box(Wd.w, Wd.h + .05, Wd.d, Wd.x, Wd.h / 2 - .025, Wd.z, pm); const c = box(Wd.w + .1, .1, Wd.d + .1, Wd.x, Wd.h + .05, Wd.z, cm);
  const hit = box(Wd.w - .4, 1.9, .5, Wd.x, 1.1, Wd.z + Wd.d / 2 + .25, hidden, { cast: false });
  interact(hit, 'Wandbild ansehen', () => zeichen_wandAnsehen()); zeichen_S.wand = { m, c, hit, mesh: null, url: null };
}
function zeichen_wandMalen() {
  const W = 2048, H = 736, c = zeichen_cv(W, H), x = c.getContext('2d', { willReadFrequently: true }), R = zeichen_rng(1976), ink = '#2c261f';
  x.lineCap = x.lineJoin = 'round';
  const form = (fill, path, lw = 5, st = ink) => { x.beginPath(); path(); if (fill) { x.fillStyle = fill; x.fill(); } if (lw) { x.strokeStyle = st; x.lineWidth = lw; x.stroke(); } };
  const pin = (n, col, x0, y0, x1, y1, s0, s1) => { for (let i = 0; i < n; i++) { x.strokeStyle = col(); x.lineWidth = s0 + R() * (s1 - s0); const px = x0 + R() * (x1 - x0), py = y0 + R() * (y1 - y0); x.beginPath(); x.moveTo(px, py); x.lineTo(px + 20 + R() * 60, py + (R() - .5) * 8); x.stroke(); } };
  const haus = (hx, hy, w, h, wand, dach, fenster = 2) => { form(wand, () => x.rect(hx, hy, w, h), 4); form(dach, () => { x.moveTo(hx - 8, hy); x.lineTo(hx + w / 2, hy - h * .62); x.lineTo(hx + w + 8, hy); x.closePath(); }, 4);
    for (let i = 0; i < fenster; i++) form('#e8c25a', () => x.rect(hx + w * (.18 + i * .42), hy + h * .25, w * .22, h * .24), 3); form('#6b4428', () => x.rect(hx + w * .42, hy + h * .58, w * .17, h * .42), 3); };
  // Malfläche mit unregelmäßigem Rand
  const rand = new Path2D(); rand.moveTo(22, 28); for (let i = 1; i <= 20; i++) rand.lineTo(22 + i * (W - 44) / 20, 24 + R() * 10); for (let i = 1; i <= 8; i++) rand.lineTo(W - 20 - R() * 8, 24 + i * (H - 46) / 8);
  for (let i = 1; i <= 20; i++) rand.lineTo(W - 22 - i * (W - 44) / 20, H - 22 - R() * 8); for (let i = 1; i < 8; i++) rand.lineTo(20 + R() * 8, H - 22 - i * (H - 46) / 8); rand.closePath(); x.save(); x.clip(rand);
  const sky = x.createLinearGradient(0, 0, 0, H * .56); sky.addColorStop(0, '#2e5d8f'); sky.addColorStop(1, '#a8c6d4'); x.fillStyle = sky; x.fillRect(0, 0, W, H);
  pin(150, () => `rgba(${R() < .5 ? '255,255,255' : '28,58,104'},${.04 + R() * .06})`, 0, 0, W, H * .52, 8, 22);
  for (const [cx, cy, s] of [[420, 120, 1], [1010, 76, .8], [1250, 170, .65]]) for (let k = 0; k < 5; k++) form('rgba(242,242,234,.94)', () => x.arc(cx + (k - 2) * 38 * s, cy + (k % 2 ? -14 : 6) * s, (32 + R() * 12) * s, 0, 7), 0);
  // die Sonne mit Gesicht (Kinderhand)
  form('#f2c531', () => x.arc(190, 175, 62, 0, 7), 5); for (let i = 0; i < 12; i++) { const g = i / 12 * PI * 2; form(null, () => { x.moveTo(190 + Math.cos(g) * 74, 175 + Math.sin(g) * 74); x.lineTo(190 + Math.cos(g) * 104, 175 + Math.sin(g) * 104); }, 6, '#e0a820'); }
  form(null, () => { x.arc(190, 186, 30, .3, PI - .3); }, 4); form(ink, () => { x.arc(170, 160, 6, 0, 7); x.moveTo(216, 160); x.arc(210, 160, 6, 0, 7); }, 0);
  // die „zweite Sonne“ (Lichtschiff): blasse Scheibe mit Lichterkranz und Strahl bis auf die Kreuzung – dünn gemalt, später übermalt, die Übermalung blättert
  { x.save(); x.globalAlpha = .55; const sx = 1470, sy = 112, kx = 1180, ky = 560; const g = x.createLinearGradient(sx, sy, kx, ky); g.addColorStop(0, 'rgba(250,252,255,.5)'); g.addColorStop(1, 'rgba(250,252,255,.12)');
    x.fillStyle = g; x.beginPath(); x.moveTo(sx - 40, sy + 20); x.lineTo(sx + 40, sy + 20); x.lineTo(kx + 34, ky); x.lineTo(kx - 34, ky); x.closePath(); x.fill(); x.globalAlpha = .8;
    form('#f4f6f8', () => x.ellipse(sx, sy, 78, 30, 0, 0, 7), 3, '#9aa6b0'); for (let i = 0; i < 9; i++) form('#fffbe6', () => x.arc(sx - 64 + i * 16, sy + 4 + Math.sin(i / 8 * PI) * 10, 5, 0, 7), 0);
    x.restore(); const ov = zeichen_cv(260, 520), o = ov.getContext('2d'); o.fillStyle = '#7fa6c4'; o.globalAlpha = .82; o.fillRect(0, 0, 260, 520); o.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 70; i++) { o.globalAlpha = .6 + R() * .4; o.beginPath(); o.ellipse(R() * 260, R() * 520, 8 + R() * 34, 6 + R() * 22, R() * 3, 0, 7); o.fill(); } x.drawImage(ov, sx - 130, sy - 60); }
  // Hügel, Wald (Norden), Kirchberg
  form('#5b8550', () => { x.moveTo(0, 340); x.bezierCurveTo(400, 250, 700, 230, 1000, 300); x.bezierCurveTo(1300, 250, 1700, 230, 2048, 290); x.lineTo(2048, 736); x.lineTo(0, 736); }, 0);
  for (let i = 0; i < 34; i++) { const tx = 1380 + i * 19 + R() * 10, ty = 300 - R() * 20, th = 70 + R() * 40; form(R() < .5 ? '#2c4a30' : '#36553a', () => { x.moveTo(tx, ty - th); x.lineTo(tx + 22, ty + 8); x.lineTo(tx - 22, ty + 8); x.closePath(); }, 2, '#1f2e20'); }
  form('#70a05a', () => { x.moveTo(0, 430); x.bezierCurveTo(300, 360, 560, 290, 800, 330); x.bezierCurveTo(1000, 360, 1300, 400, 2048, 380); x.lineTo(2048, 736); x.lineTo(0, 736); }, 0);
  pin(120, () => `rgba(${R() < .5 ? '40,80,30' : '150,190,110'},${.08 + R() * .1})`, 0, 360, W, 640, 6, 14);
  // Kapelle mit Friedhof; am Fuß des linken Torpfeilers eine kleine Laterne
  haus(650, 240, 150, 95, '#ece6d6', '#a3372b', 1); form('#ece6d6', () => x.rect(780, 170, 46, 165), 4); form('#a3372b', () => { x.moveTo(772, 170); x.lineTo(803, 118); x.lineTo(834, 170); x.closePath(); }, 4);
  form(null, () => { x.moveTo(803, 118); x.lineTo(803, 92); x.moveTo(792, 102); x.lineTo(814, 102); }, 4);
  for (let i = 0; i < 6; i++) form(null, () => { const kx = 560 + i * 26, ky = 352 + (i % 2) * 8; x.moveTo(kx, ky); x.lineTo(kx, ky - 26); x.moveTo(kx - 8, ky - 18); x.lineTo(kx + 8, ky - 18); }, 4, '#5a5048');
  form('#8a8378', () => x.rect(620, 330, 16, 46), 3); form('#8a8378', () => x.rect(690, 330, 16, 46), 3); form(null, () => { x.moveTo(636, 340); x.lineTo(664, 352); x.moveTo(690, 340); x.lineTo(676, 352); }, 3);
  form(null, () => { x.moveTo(596, 346); x.lineTo(616, 354); x.lineTo(616, 360); }, 3); form('#f2b23c', () => x.ellipse(616, 372, 11, 13, 0, 0, 7), 3); form('#c84a1a', () => x.arc(616, 373, 3.5, 0, 7), 0);
  // Schrebergärten: Zäune, Lauben, offenes Tor „7“, Brunnen mit Rabe (Silber im Schnabel)
  for (let i = 0; i < 30; i++) form(null, () => { const fx = 330 + i * 9; x.moveTo(fx, 470); x.lineTo(fx, 446); }, 3, '#7a5a3a'); form(null, () => { x.moveTo(326, 452); x.lineTo(600, 452); x.moveTo(326, 464); x.lineTo(600, 464); }, 3, '#7a5a3a');
  haus(360, 400, 70, 48, '#8c6a4a', '#5c3a26', 1); haus(470, 395, 66, 52, '#6e8a5a', '#5c3a26', 1);
  form('#a07848', () => { x.moveTo(545, 446); x.lineTo(572, 432); x.lineTo(572, 470); x.lineTo(545, 470); x.closePath(); }, 3); x.fillStyle = ink; x.font = 'bold 22px Arial'; x.fillText('7', 553, 462);
  form('#9c968a', () => x.ellipse(470, 520, 46, 18, 0, 0, 7), 4); form('#9c968a', () => x.rect(424, 520, 92, 34), 4); form('#6a4a30', () => { x.moveTo(424, 470); x.lineTo(470, 452); x.lineTo(516, 470); x.closePath(); }, 3);
  form(null, () => { x.moveTo(430, 470); x.lineTo(430, 515); x.moveTo(510, 470); x.lineTo(510, 515); }, 3);
  form('#121214', () => { x.ellipse(494, 494, 24, 13, -.3, 0, 7); x.moveTo(512, 484); x.arc(514, 482, 10, 0, 7); x.moveTo(470, 500); x.lineTo(452, 510); x.lineTo(474, 506); }, 0); form('#121214', () => { x.moveTo(522, 479); x.lineTo(538, 484); x.lineTo(522, 488); }, 0); form('#e4e8ea', () => x.ellipse(542, 486, 6, 3.5, .2, 0, 7), 0);
  // Hof: rote Scheune, roter Trecker mit einem Auge im Scheinwerfer
  haus(50, 330, 170, 110, '#9a3a2c', '#5a2a22', 0); form('#5e2018', () => x.rect(108, 380, 54, 60), 3);
  form('#c43a2a', () => { x.rect(210, 420, 92, 42); x.rect(262, 392, 40, 30); }, 4); form('#2a2a2a', () => x.arc(232, 470, 20, 0, 7), 4); form('#2a2a2a', () => x.arc(290, 474, 14, 0, 7), 4);
  form('#f6f0d0', () => x.arc(306, 430, 15, 0, 7), 3); form(null, () => { x.moveTo(295, 430); x.quadraticCurveTo(306, 421, 317, 430); x.quadraticCurveTo(306, 439, 295, 430); }, 2.5); form(ink, () => x.arc(306, 430, 4, 0, 7), 0);
  // Dorf: Straße mit Kreuzung, Häuser, Bus „7“
  form('#77746c', () => { x.moveTo(700, 548); x.lineTo(1760, 540); x.lineTo(1760, 584); x.lineTo(700, 594); x.closePath(); }, 0); form('#77746c', () => { x.moveTo(1160, 430); x.lineTo(1196, 430); x.lineTo(1210, 548); x.lineTo(1150, 548); x.closePath(); }, 0);
  for (const [hx, hy, w, h, wa, da] of [[760, 470, 80, 70, '#e3d7b8', '#9b3b2b'], [870, 476, 70, 64, '#c9b994', '#7b4a2c'], [970, 466, 84, 76, '#d8cfb6', '#9b3b2b'], [1060, 478, 64, 62, '#b9c2b6', '#5e5e5e'],
    [1240, 470, 82, 70, '#e1d3b0', '#9b3b2b'], [1340, 478, 66, 62, '#cfc4a4', '#7b4a2c'], [1430, 468, 80, 72, '#d9d0bc', '#9b3b2b']]) haus(hx, hy, w, h, wa, da);
  form('#e8b422', () => x.rect(1500, 536, 120, 40), 4); for (let i = 0; i < 4; i++) form('#bcd3dc', () => x.rect(1508 + i * 27, 542, 20, 14), 2); form('#2a2a2a', () => { x.arc(1524, 578, 9, 0, 7); x.moveTo(1606, 578); x.arc(1598, 578, 9, 0, 7); }, 3);
  x.fillStyle = ink; x.font = 'bold 22px Arial'; x.fillText('7', 1600, 570);
  // Martinszug: Kinder mit Laternen
  for (let i = 0; i < 9; i++) { const kx = 820 + i * 38, ky = 640 + (i % 2) * 6, lc = ['#e8522c', '#f2c531', '#5aa0d8', '#e86aa0'][i % 4];
    form('#f0d2b0', () => x.arc(kx, ky - 30, 8, 0, 7), 2); form(['#3a5a8a', '#8a3a3a', '#3a7a4a'][i % 3], () => { x.moveTo(kx - 9, ky - 20); x.lineTo(kx + 9, ky - 20); x.lineTo(kx + 12, ky + 6); x.lineTo(kx - 12, ky + 6); x.closePath(); }, 2);
    form(null, () => { x.moveTo(kx + 6, ky - 14); x.lineTo(kx + 22, ky - 40); x.lineTo(kx + 22, ky - 30); }, 2); form(lc, () => x.arc(kx + 22, ky - 22, 9, 0, 7), 2); }
  // Spielplatz: Rutsche; im Sand darunter drei weiße Punkte
  form('#d8c38a', () => x.ellipse(1720, 600, 150, 26, 0, 0, 7), 0); form('#c43a2a', () => { x.moveTo(1660, 470); x.lineTo(1676, 470); x.lineTo(1790, 590); x.lineTo(1772, 594); x.closePath(); }, 4);
  form(null, () => { x.moveTo(1660, 470); x.lineTo(1650, 596); x.moveTo(1676, 470); x.lineTo(1682, 596); for (let i = 0; i < 6; i++) { x.moveTo(1650 + i * 1.6, 490 + i * 18); x.lineTo(1682 - i * .4, 490 + i * 18); } }, 3);
  for (const [a, b] of [[1702, 594], [1689, 610], [1715, 610]]) form('#f4f2ea', () => x.arc(a, b, 5.5, 0, 7), 0);
  form(null, () => { x.moveTo(1830, 470); x.lineTo(1810, 600); x.moveTo(1830, 470); x.lineTo(1850, 600); x.moveTo(1930, 470); x.lineTo(1910, 600); x.moveTo(1930, 470); x.lineTo(1950, 600); x.moveTo(1824, 472); x.lineTo(1936, 472); x.moveTo(1860, 472); x.lineTo(1862, 560); x.moveTo(1890, 472); x.lineTo(1888, 560); }, 4, '#4a4a4a');
  form('#8a5a30', () => x.rect(1852, 558, 46, 8), 2);
  // Wiese, Blumen
  form('#6a9a50', () => { x.moveTo(0, 660); x.bezierCurveTo(600, 640, 1400, 650, 2048, 640); x.lineTo(2048, 736); x.lineTo(0, 736); }, 0);
  for (let i = 0; i < 90; i++) { const fx = R() * W, fy = 668 + R() * 54; form(['#e8522c', '#f2c531', '#f4f2ea', '#c86ad8'][i % 4], () => x.arc(fx, fy, 4 + R() * 3, 0, 7), 0); }
  // Schriftband „UNSER DORF“ mit Wappen (Turm über dem Abgrund)
  form('#efe6c8', () => { x.moveTo(70, 34); x.lineTo(560, 30); x.lineTo(574, 64); x.lineTo(560, 98); x.lineTo(70, 102); x.lineTo(84, 66); x.closePath(); }, 4);
  x.fillStyle = '#7a2a1e'; x.font = `bold 54px ${ZEICHEN_DICK}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('UNSER DORF', 340, 68);
  form('#d8c27a', () => { x.moveTo(600, 32); x.lineTo(680, 32); x.lineTo(680, 82); x.quadraticCurveTo(680, 118, 640, 128); x.quadraticCurveTo(600, 118, 600, 82); x.closePath(); }, 4);
  { const pf = (p) => form(null, () => p.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)), 3, '#3a2a1e'); pf([[628, 86], [628, 50], [633, 50], [633, 44], [638, 44], [638, 50], [643, 50], [643, 44], [648, 44], [648, 50], [653, 50], [653, 86]]);
    pf([[610, 86], [670, 86]]); pf([[616, 86], [624, 100], [620, 110]]); pf([[664, 86], [656, 100], [660, 112]]); }
  x.fillStyle = 'rgba(44,38,31,.85)'; x.font = '26px Georgia'; x.textAlign = 'right'; x.fillText('Klasse 3b · Grundschule am Kirchberg · 1976', W - 50, H - 40);
  x.restore();
  // Alter: verblasst, entsättigt, Risse, Abplatzer (unten mehr: Feuchte), Regenschlieren von oben, Algen am Fuß
  { const mk = zeichen_cv(W, H); mk.getContext('2d').drawImage(c, 0, 0); x.save(); x.globalCompositeOperation = 'saturation'; x.fillStyle = 'rgba(128,128,128,.42)'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'destination-in'; x.drawImage(mk, 0, 0); x.restore(); }
  x.save(); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(205,200,186,.2)'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${R() < .7 ? '38,36,28' : '232,230,214'},${.04 + R() * .1})`; const sx = R() * W; x.fillRect(sx, 0, 1 + R() * 6, H * (.1 + R() * .7)); }
  const dg = x.createLinearGradient(0, H * .74, 0, H); dg.addColorStop(0, 'rgba(34,44,24,0)'); dg.addColorStop(1, 'rgba(34,44,24,.55)'); x.fillStyle = dg; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { x.strokeStyle = 'rgba(32,28,22,.5)'; x.lineWidth = .8 + R(); let px = R() * W, py = R() * H; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 8; k++) { px += (R() - .5) * 40; py += R() * 24; x.lineTo(px, py); } x.stroke(); }
  for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(${60 + R() * 30},${80 + R() * 30},40,${.15 + R() * .3})`; x.beginPath(); x.arc(R() * W, H - R() * R() * 140, 1 + R() * 4, 0, 7); x.fill(); } x.restore();
  // Abplatzer in Nestern (Feuchte unten und an den Rändern): darunter kommt die helle Grundierung, an wenigen Stellen der nackte Putz
  const flocke = (px, py, r) => { x.beginPath(); for (let k = 0; k < 8; k++) { const g = k / 8 * PI * 2, rr = r * (.45 + R() * .75); k ? x.lineTo(px + Math.cos(g) * rr, py + Math.sin(g) * rr * .75) : x.moveTo(px + rr, py); } x.closePath(); x.fill(); };
  x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
  for (let n = 0; n < 26; n++) { const unten = R() < .6, cx = R() < .25 ? (R() < .5 ? 40 + R() * 120 : W - 40 - R() * 120) : R() * W, cy = unten ? H * (.72 + R() * .26) : R() * H, k = 14 + R() * 30;
    for (let i = 0; i < k; i++) flocke(cx + (R() - .5) * 150, cy + (R() - .5) * 70, 3 + R() * R() * 26); }
  for (let i = 0; i < 160; i++) flocke(R() * W, R() * H, 1.5 + R() * 4); x.restore();
  x.save(); x.clip(rand); x.globalCompositeOperation = 'destination-over'; x.fillStyle = '#c4bdae'; x.fillRect(0, 0, W, H); x.restore();
  x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; for (let n = 0; n < 9; n++) { const cx = R() * W, cy = H * (.78 + R() * .2); for (let i = 0; i < 10; i++) flocke(cx + (R() - .5) * 70, cy + (R() - .5) * 30, 3 + R() * 12); } x.restore();
  // später darübergeschrieben: Jugend im Ort
  x.save(); x.lineCap = 'round'; x.fillStyle = 'rgba(16,16,18,.88)'; x.font = `48px ${ZEICHEN_HAND}`; x.translate(1130, 700); x.rotate(-.025); x.fillText('LINIE 7 KOMMT NIE', 0, 0); x.restore();
  x.save(); x.strokeStyle = 'rgba(178,24,34,.85)'; x.lineWidth = 6; x.translate(1985, 640); x.beginPath(); x.moveTo(0, 34); x.bezierCurveTo(-36, 10, -28, -26, 0, -6); x.bezierCurveTo(28, -26, 36, 10, 0, 34); x.stroke();
  x.fillStyle = 'rgba(16,16,18,.85)'; x.font = `26px ${ZEICHEN_HAND}`; x.textAlign = 'center'; x.fillText('S + T', 0, 10); x.restore();
  x.save(); x.translate(1040, 236); x.rotate(-.05); x.font = `40px ${ZEICHEN_DICK}`; x.textAlign = 'center'; x.lineJoin = 'round'; x.strokeStyle = 'rgba(20,20,20,.8)'; x.lineWidth = 7; x.strokeText('NIEMANDSLAND', 0, 0); x.fillStyle = 'rgba(196,198,192,.85)'; x.fillText('NIEMANDSLAND', 0, 0); x.restore();
  // Höhe: Farbe liegt etwas auf dem Putz, Abplatzer sind Kanten → Normal-Map (halbe Auflösung reicht)
  const hw = W / 2, hh = H / 2, hc = zeichen_cv(hw, hh), hx = hc.getContext('2d', { willReadFrequently: true }); hx.drawImage(c, 0, 0, hw, hh); const id = hx.getImageData(0, 0, hw, hh), dd = id.data;
  for (let i = 0; i < dd.length; i += 4) { const v = 116 + dd[i + 3] / 255 * 26; dd[i] = dd[i + 1] = dd[i + 2] = v; dd[i + 3] = 255; } hx.putImageData(id, 0, 0);
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8; const nrm = new THREE.CanvasTexture(normalFromHeight(hc, 3)); nrm.anisotropy = 4;
  return { map, nrm, canvas: c };
}
function zeichen_wandBau() { const S = zeichen_S, Wd = ZEICHEN_WAND; if (!S.wand || S.wand.mesh) return;
  const { map, nrm, canvas } = zeichen_wandMalen(); S.wand.canvas = canvas;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(Wd.w - .3, (Wd.w - .3) * 736 / 2048), new THREE.MeshStandardMaterial({ map, normalMap: nrm, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, roughness: .9, envMapIntensity: .25 }));
  m.position.set(Wd.x, 1.12, Wd.z + Wd.d / 2 + .004); m.receiveShadow = true; m.userData.noCol = true; m.renderOrder = 2; scene.add(m); S.wand.mesh = m; }
function zeichen_wandAnsehen() { const S = zeichen_S; if (!S.wand) return; if (!S.wand.mesh) zeichen_wandBau();
  if (!S.wand.url) { const c = zeichen_cv(1400, 503), x = c.getContext('2d'); x.fillStyle = '#8f887a'; x.fillRect(0, 0, 1400, 503); x.drawImage(S.wand.canvas, 0, 0, 1400, 503); S.wand.url = c.toDataURL('image/jpeg', .84); }
  openNote('Wandbild an der Haltestelle', `<img src="${S.wand.url}" style="width:100%;display:block;margin:4px 0 10px;filter:brightness(.92)">Dispersionsfarbe auf Putz, ausgeblichen, unten abgeplatzt. Unten rechts, kaum noch lesbar: <i>Klasse 3b · Grundschule am Kirchberg · 1976</i>.`); }
// ---------------------------------------------------------------- Nazca-Prinzip: eine durchgehende Linie im Waldboden, nur vom Hochsitz lesbar (Kap. 6)
// Punkte in Metern: lx nach rechts, ly vom Betrachter weg (Hochsitz). Der Rabe mit gespreizten Schwingen; der Hirsch im Profil, der Kopf sitzt verkehrt herum (sieht zum Schwanz).
const ZEICHEN_NAZCA = [
  { id: 'kreise', c: [29.5, 169], s: .8, luke: 'Und da drüben … Kreise. Sieben. Und ein halber. Wie das Brandzeichen an der Kuh.',
    pts: (() => { const P = [[-11, 6.5], [-8.6, 1.6]], r = 1.4, perle = (cx, cy, voll) => { const n = voll ? 14 : 7; for (let i = 0; i <= n; i++) { const t = -PI / 2 + (voll ? 2 : 1) * PI * i / n; P.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } };
      for (const a of [-7.2, -3.6, 0, 3.6]) { perle(a, 3, true); } P.push([6.4, 1.6], [7.6, -.6], [5.4, -2.4]); // Schnur, Bogen nach unten
      for (const a of [3.6, 0, -3.6]) { P.push([a + .01, -2.4]); perle(a, -1, true); } P.push([-7.2, -2.4]); perle(-7.2, -1, false); return P; })() },
  { id: 'rabe', c: [-1, 173.1], s: .8, luke: 'Von hier oben … das ist ein Vogel. Jemand hat einen Vogel in den Waldboden gezogen. Einen riesigen.',
    pts: (() => { const h = [[0, 6.5], [.45, 5.6], [.9, 5.2], [1, 4.4], [1.3, 3.6], [3, 3.4], [5, 3.6], [6.6, 3.3], [8, 2.8], [8.4, 2.2], [7.4, 1.9], [8.2, 1.3], [7.1, 1.1], [7.8, .4], [6.6, .4], [7, -.3], [5.6, 0],
      [4, .6], [2.4, .4], [1.4, -.4], [1.2, -1.8], [1, -2.6], [2, -5], [1.2, -4.8], [1.3, -5.6], [.5, -5.2], [0, -5.9]];
      return [[0, -9.5], ...h.slice().reverse(), ...h.slice(1).map(([a, b]) => [-a, b]), [0, -5.9]]; })() },
  { id: 'hirsch', c: [13.2, 162.5], s: .85, luke: 'Und daneben ein Hirsch. Der Kopf sitzt verkehrt herum.',
    pts: [[-4.9, -9.6], [-4.9, -5.9], [-4.5, -5.9], [-4.6, -5], [-4.9, -2.5], [-4.5, -.5], [-2, -.8], [1, -.7], [3.4, -.9], [3.8, -3], [3.9, -5.9], [4.6, -5.9], [4.5, -5.2], [4.3, -2.8], [4.2, -.4], [4.6, .8], [5, 2.2], [5.3, 3.6],
      [5.6, 4.8], [5.9, 5.1], [6.3, 5.7], [5.3, 5.45], [5.6, 6], [6.1, 7.2], [5.3, 6.6], [5.4, 7.9], [4.9, 7], [4.5, 8], [4.4, 7], [3.9, 7.3], [4.5, 6.4], [4.6, 5.35], [3.4, 5.15], [2.1, 4.95], [1.7, 4.6], [2.1, 4.3], [3.2, 4.15],
      [4.3, 4.1], [4, 3.5], [3.3, 2.7], [1.5, 2.3], [-1.5, 2.5], [-4.5, 2.6], [-7.2, 2.2], [-7.4, 2.5], [-7.9, 2], [-7.3, 1.6], [-7, .4], [-6.4, -1.5], [-5.6, -3.4], [-5.2, -5.9], [-4.9, -5.9]] },
  { id: 'spirale', c: [46, 166], s: .75, luke: 'Eine Spirale. Drei Windungen, und am Ende läuft die Linie einfach aus dem Kreis hinaus. Als würde etwas nach draußen wollen. Oder hinein.',
    pts: (() => { const P = []; for (let i = 0; i <= 54; i++) { const t = i / 54 * PI * 6, r = .5 + t * .36; P.push([r * Math.cos(t + PI), r * Math.sin(t + PI)]); } const e = P[P.length - 1]; P.push([e[0] + 2.4, e[1] + .4], [e[0] + 5, e[1] - 1.2], [e[0] + 8, e[1] - 4.5]); return P; })() },
  { id: 'spinne', c: [-12, 167], s: .8, luke: 'Eine Spinne. Acht Beine, jedes mit zwei Knicken. Genauso hat sie im Amt an der Decke gesessen.',
    pts: (() => { const P = [], K = 14; for (let i = 0; i <= K; i++) { const t = i / K * PI * 2; P.push([1.3 * Math.cos(t), 1.8 * Math.sin(t)]); }
      const bein = (sx, y0, dy) => { const j = [[1.3 * sx, y0], [3.2 * sx, y0 + dy * 1.6], [5.2 * sx, y0 + dy * .9], [6.8 * sx, y0 + dy * -1.4]]; for (const q of j) P.push(q); for (let k = j.length - 2; k >= 0; k--) P.push(j[k]); };
      for (const [y0, dy] of [[1, 1], [.4, .5], [-.4, -.5], [-1, -1]]) { bein(1, y0, dy); bein(-1, y0, dy); } P.push([0, 0]); return P; })() }];
function zeichen_nazcaTex() { // Kachel 256²: u entlang der Linie, v quer – freigescharrte helle Erde, Ränder aus zur Seite geschobenem Laub
  const N = 256, c = zeichen_cv(N, N), x = c.getContext('2d'), hc = zeichen_cv(N, N), y = hc.getContext('2d'), R = zeichen_rng(1312);
  const img = x.createImageData(N, N), hi = y.createImageData(N, N), d = img.data, e = hi.data;
  for (let j = 0; j < N; j++) { const v = j / (N - 1), q = Math.abs(v - .5) * 2, rand = Math.exp(-Math.pow((q - .78) / .1, 2)), mitte = 1 - Math.min(1, Math.max(0, (q - .55) / .25));
    for (let i = 0; i < N; i++) { const o = (j * N + i) * 4, n = R(), n2 = Math.sin(i / N * PI * 8 + j * .07) * .5 + .5;
      const r = 140 + n * 26 + mitte * 30, g = 124 + n * 22 + mitte * 24, b = 100 + n * 16 + mitte * 16, lr = 46 + n * 20, lg = 36 + n * 14, lb = 24 + n * 10, k = rand * (1 - mitte);
      d[o] = r * (1 - k) + lr * k; d[o + 1] = g * (1 - k) + lg * k; d[o + 2] = b * (1 - k) + lb * k; d[o + 3] = 255 * Math.min(1, Math.max(0, (1 - q) * 4.5)) * (.82 + n2 * .18);
      const hv = 128 - mitte * 40 + rand * 50 + (n - .5) * 14; e[o] = e[o + 1] = e[o + 2] = hv; e[o + 3] = 255; } }
  x.putImageData(img, 0, 0); y.putImageData(hi, 0, 0);
  for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(${R() < .5 ? '150,140,120' : '40,30,20'},${.3 + R() * .4})`; x.beginPath(); x.arc(R() * N, N * (.3 + R() * .4), .8 + R() * 2, 0, 7); x.fill(); }
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = THREE.RepeatWrapping; map.anisotropy = 8;
  const nrm = new THREE.CanvasTexture(normalFromHeight(hc, 4)); nrm.wrapS = THREE.RepeatWrapping; return { map, nrm };
}
function zeichen_nazcaBau() {
  const S = zeichen_S, TS = typeof TIEF !== 'undefined' ? TIEF.stand : { x: 14, z: 178.5 }, pos = [], uv = [], nrm = [], idx = [], proben = [], W = .95;
  for (const F of ZEICHEN_NAZCA) {
    const fx = F.c[0] - TS.x, fz = F.c[1] - TS.z, fl = Math.hypot(fx, fz), f = [fx / fl, fz / fl], r = [-f[1], f[0]]; // r = rechts vom Betrachter
    const wp = F.pts.map(([a, b]) => new THREE.Vector3(F.c[0] + (a * r[0] + b * f[0]) * F.s, 0, F.c[1] + (a * r[1] + b * f[1]) * F.s));
    const cur = new THREE.CatmullRomCurve3(wp, false, 'centripetal', .5); let L = 0; for (let i = 1; i < wp.length; i++) L += wp[i].distanceTo(wp[i - 1]);
    const n = Math.max(40, Math.ceil(L / .35)), p = cur.getSpacedPoints(n), base = pos.length / 3; let u = 0;
    for (let i = 0; i <= n; i++) { const a = p[Math.max(0, i - 1)], b = p[Math.min(n, i + 1)], tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1, nx = -tz / tl, nz = tx / tl, w = W * (.85 + .3 * Math.sin(i * .37) * Math.sin(i * .11));
      if (i) u += p[i].distanceTo(p[i - 1]); const y = zeichen_boden(p[i].x, p[i].z) + .035;
      pos.push(p[i].x + nx * w / 2, y, p[i].z + nz * w / 2, p[i].x - nx * w / 2, y, p[i].z - nz * w / 2); nrm.push(0, 1, 0, 0, 1, 0); uv.push(u / 1.6, 0, u / 1.6, 1);
      if (i % 6 === 0) proben.push(p[i].x, p[i].z); if (i < n) { const k = base + i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } }
    F.cw = new THREE.Vector3(F.c[0], 0, F.c[1]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere();
  const T = zeichen_nazcaTex(), m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: T.map, normalMap: T.nrm, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, roughness: .97, envMapIntensity: .1 }));
  m.receiveShadow = true; m.userData.noCol = true; m.matrixAutoUpdate = false; m.renderOrder = 1; scene.add(m); S.nazca = { m, proben, ts: TS };
}
// ---------------------------------------------------------------- Lukes Gedanken (höchstens einige, knapp) und Kreide, die im Rücken erscheint
function zeichen_gedanke(id, text, ms = 400, prio = 2) { if (typeof gedanke === 'function') try { gedanke('x7_' + id, text, ms, prio); } catch (e) {} }
function zeichen_blick(P, maxD, minDot) { _zt.subVectors(P, camera.position); const d = _zt.length(); if (d > maxD || d < .01) return -1; return _zt.dot(_zf) / d >= minDot ? d : -1; }
function zeichen_lampeAuf(P) { if (!flashOn || fogUniforms.flK.value.x < .15) return false; _zt.subVectors(P, fogUniforms.flP.value); const d = _zt.length(); return d < 7 && _zt.dot(fogUniforms.flD.value) / d > Math.cos(flashlight.angle * .9); }
function zeichen_lesen(dt) {
  const S = zeichen_S, K = ZU.uKap.value; camera.getWorldDirection(_zf);
  for (const d of S.luke) { if (d.said) continue; const k = d.k || [1, 7]; if (K < k[0] || K > k[1]) continue; const dd = zeichen_blick(d.P, d.s === 1 ? 5 : 6, .86); if (dd < 0) continue;
    if (d.s === 1 && !zeichen_lampeAuf(d.P)) continue; if (d.s === 2) continue; d.said = true; zeichen_gedanke(d.id, d.luke); }
  for (const d of S.neuL) { const k = d.k || [1, 7]; if (K < k[0] || K > k[1]) continue;
    if (S.neu.has(d.id)) { if (d.leer && d.luke && !d.said && zeichen_blick(d.P, 14, .86) > 0) { d.said = true; zeichen_gedanke(d.id, d.luke, 300, 3); } continue; }
    const dist = Math.hypot(d.P.x - player.pos.x, d.P.z - player.pos.z), sicht = zeichen_blick(d.P, 30, .45) > 0;
    if (sicht) { if (dist < 16) d.leer = true; d.wegT = 0; } else { d.wegT = (d.wegT || 0) + dt; if (d.wegT > 3 && (d.leer || dist > 30 || d.wegT > 20)) { S.neu.add(d.id); zeichen_zeig(d, 1); } } }
  if (S.wand && S.wand.mesh && !S.wandSaid && zeichen_blick(_zv.set(ZEICHEN_WAND.x, 1.1, ZEICHEN_WAND.z), 7, .82) > 0) { S.wandSaid = true; zeichen_gedanke('wandbild', 'Ein Heimatbild mit zwei Sonnen. Und keiner hat’s übermalt.'); }
  const Nz = S.nazca; if (Nz) { const TS = Nz.ts, oben = player.pos.y > 2.2 && Math.hypot(player.pos.x - TS.x, player.pos.z - TS.z) < 3;
    if (oben && _zf.y < -.12) for (const F of ZEICHEN_NAZCA) { if (F.said || !F.cw) continue; _zt.subVectors(F.cw, camera.position).normalize(); if (_zt.dot(_zf) > .72) { F.said = true; zeichen_gedanke('nazca_' + F.id, F.luke, F.id === 'rabe' ? 300 : 2500, 3); } }
    if (!oben && !S.furche && player.pos.y < 1.2) { const p = Nz.proben; for (let i = 0; i < p.length; i += 2) if (Math.abs(p[i] - player.pos.x) < 1 && Math.abs(p[i + 1] - player.pos.z) < 1) { S.furche = true; zeichen_gedanke('furche', 'Furchen im Laub. Wie mit einem Stock gezogen. Sie laufen weiter, als die Lampe reicht.', 600, 1); break; } } }
}
function zeichen_foto() { // nach einem Polaroid: Zeichen, die nur der Blitz zeigt und im Bild waren
  const S = zeichen_S, cam = S.blitzCam; if (!cam) return; _zm4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  for (const id in S.B) for (const d of S.B[id].list) { if (!d.ok || !d.foto || d.said) continue; const k = d.k || [1, 7]; if (ZU.uKap.value < k[0] || ZU.uKap.value > k[1]) continue;
    if (d.P.distanceTo(cam.position) > 14) continue; _zt.copy(d.P).applyMatrix4(_zm4); if (Math.abs(_zt.x) < .9 && Math.abs(_zt.y) < .9 && _zt.z < 1) { d.said = true; zeichen_gedanke(d.id, d.foto, 5600, 3); } } }
// ---------------------------------------------------------------- Takt
function zeichen_tick(dt, t, indoor) {
  const S = zeichen_S; if (!S.ready || !state.started) return;
  if (S.bildM && (S.bildF = (S.bildF || 0) + 1) % 30 === 0) { const K = typeof kap === 'function' ? kap() : 1; for (const [m, k] of S.bildM) m.visible = K >= k[0] && K <= k[1]; } // Wandbilder/Kreide je Kapitel
  if (S.q.length) for (let n = 0; n < 2 && S.q.length; n++) { const [B, d] = S.q.shift(); let ok = false; try { ok = B.kanal ? zeichen_kanalPlatz(B, d) : zeichen_platz(B, d); } catch (e) { console.warn('Zeichen: Platz', d.id, e); }
    d.wartet = false; if (!ok) { d.tries = (d.tries || 0) + 1; d.next = performance.now() + 6000; if (d.tries >= 3) S.warn.push(d.id); } else if (!S.q.some(e => e[0] === B)) zeichen_geo(B); }
  if (!S.q.length) for (const id in S.B) if (S.B[id].neu) zeichen_geo(S.B[id]);
  S.t -= dt; if (S.t <= 0) { S.t = .5; ZU.uKap.value = typeof kap === 'function' ? kap() : 1; zeichen_bereiche();
    if (S.wand && !S.wand.mesh && Math.hypot(player.pos.x - ZEICHEN_WAND.x, player.pos.z - ZEICHEN_WAND.z) < 45) zeichen_wandBau();
    if (!S.nazca && ZU.uKap.value >= 6 && Math.hypot(player.pos.x - 14, player.pos.z - 175) < 60) zeichen_nazcaBau();
    if (S.B.kanal && S.B.kanal.mesh) S.B.kanal.mesh.visible = state.zone === 'canal'; if (S.nazca) S.nazca.m.visible = ZU.uKap.value >= 6; }
  if (S.blitzN !== S.blitzSeen) { S.blitzSeen = S.blitzN; zeichen_foto(); }
  S.tL -= dt; if (S.tL <= 0 && !indoor) { S.tL = .3; zeichen_lesen(.3); }
}
MOD_SAVE.push(['zeichen', () => ({ neu: [...zeichen_S.neu] }), v => { zeichen_S.neu = new Set((v && v.neu) || []); zeichen_showSync(); }]);
WORLD_MODS.push(['Zeichen', async () => {
  const S = zeichen_S; S.atlas = await zeichen_atlas(); S.mat = zeichen_material(S.atlas); S.bilder = {};
  await Promise.all(Object.entries(ZEICHEN_BILD).map(async ([k, f]) => { const im = await zeichen_bild(f); if (!im) return; const t = new THREE.Texture(im); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true;
    S.bilder[k] = { ah: im.height / im.width, mat: new THREE.MeshStandardMaterial({ map: t, transparent: true, opacity: .95, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, roughness: .82, metalness: 0, envMapIntensity: .3 }) }; }));
  try { zeichen_wandMauer(); } catch (e) { console.warn('Zeichen: Wandbild-Mauer', e); }
  // Neues Versteck, auf das das Wandbild zeigt (Laterne am linken Friedhofspfeiler); alles andere zeigt auf vorhandene Fundorte
  try { if (typeof TAUSCH_FUNDE !== 'undefined' && !TAUSCH_FUNDE.some(f => f.id === 'x7_tor')) TAUSCH_FUNDE.push({ id: 'x7_tor', k: [1, 5], at: [-55.3, 66.2], w: ['ring'], bat: 1, t: 'Am Fuß des Torpfeilers, unter einem losen Stein: ein Ring aus dem Kaugummiautomaten. Und eine Batterie, in Wachstuch eingeschlagen.' }); } catch (e) {}
  S.ready = true;
  window.__zeichen = { S, ZU, tab: ZEICHEN_TAB, blitz: on => { S.testBlitz = !!on; }, zeig: id => { S.neu.add(id); zeichen_showSync(); }, wand: () => zeichen_wandBau(), nazca: () => zeichen_nazcaBau(), bau: () => zeichen_bereiche(),
    info: () => Object.values(S.B).map(B => ({ id: B.id, n: B.list.length, offen: B.list.filter(d => !d.ok).map(d => d.id + ':' + (d.tries || 0)), ok: B.list.filter(d => d.ok).map(d => d.id + '@' + d.P.toArray().map(v => v.toFixed(2)).join(',')) })).concat([{ warn: S.warn }]) }; // Testzugriff
}]);
WORLD_TICK.push((dt, t, indoor) => zeichen_tick(dt, t, indoor));
