// =====================================================================  NEBEN3 (Modul „neben3“, Fassung 3 · AP-18): Kapitel 3 · Nebenaufgaben und Rüstungs-Hinweise
// Kanon: story_final.md „Kapitel 3 · ‚Ich komme‘ – Nebenaufgaben und offene Welt“ (31) und AP-18. Wortlaute unverändert aus der Bibel.
// Dieses Modul: Register der 20 Nebenaufgaben (Fibel-Namen), Zeitfenster (ab UK 5 bis zur vierten Laterne), Abschluss mit der vierten Laterne
// (weiter laufen nur „Siebzehn Näpfe“, „Hast du dich an mich erinnert?“, „Eine für sieben“, „Hinter deinen Füßen“), Rüstungs-Hinweise (RH, Zähler
// ch3.armorHints über justin_rh), Glocken-Joker (ch3.bell) und die Aufgaben an Orten, die AP-15 gebaut hat (Kapelle innen, Pfarrhaus, Martinsnische,
// Giselas Küche, Peters Zimmer in Nr. 4) sowie „Hinter deinen Füßen“ (Beobachter-API).
// Schnittstelle für die anderen Kap.-3-Dateien (albers, ausbau_nord, ausbau_ost_west, strasse, zayn, cleo, whiskey, geheimnisse, remise; alles mit typeof prüfen):
//   neben3_frei()              → true zwischen UK 5 und der vierten Laterne (Kapitel 3, Straße oder Atlantschiss). Auslöser davor dürfen vorbereiten, zählen aber erst dann.
//   neben3_offen(k)            → neben3_frei() und Aufgabe k weder erledigt noch geschlossen
//   neben3_start(k, karte?)    → Aufgabe k beginnen (Fibel, Nadel auf der Karte: karte = { x, z })
//   neben3_desc(k, text)       → Fibel-Beschreibung ändern · neben3_fertig(k, desc) → erledigt
//   neben3_rh(id, luke?)       → Rüstungs-Hinweis 'RH-5' … 'RH-11' zählen (einmal je ID), optional Luke-Gedanke danach
//   neben3_merk(k, wert = true)→ ch3.side[k] setzen (gespeichert; Luna-Zusatzzeilen in Raum 3, Voss/Hilde in Raum 2) · neben3_hat(k)
//   neben3_glockeFang()        → vor jedem Fang durch Graukind/Behaltene aufrufen: true = Joker hat gegriffen (Fang abbrechen, 17 s Erstarren)
//   neben3_frost()             → true, solange nach dem Glockenschlag alles erstarrt ist (Graukind, Behaltene, Nebel, Whiskey)
// Zustand der einzelnen Aufgaben: ch3.side[k] (Basis speichert ch3.side unter 'ch3') bzw. eigene MOD_SAVE-Einträge der Module.
const neben3_S = { ready: false, zu: false, frostT: 0, t: 0, fb: {} };
// Schlüssel → [Fibel-Titel, Startbeschreibung, läuft weiter nach der vierten Laterne?]
const NEBEN3 = {
  k3_rot: ['Rot eingekreist', 'An Vegas’ Briefkasten (Nr. 3) steht die Fahne oben.'],
  k3_kapelle: ['Zähl bis siebzehn, Augen zu', 'Der Kapellenschlüssel. Drinnen brennen Kerzen, und das Chorfenster leuchtet von hinten.'],
  k3_predigt: ['Die dreizehnte Predigt', 'Der Pfarrhausschlüssel von Gisela. Im Studierzimmer brennt Licht.'],
  k3_ritter: ['Dürfen Ritter weinen?', 'Nr. 4: Peters Zimmer steht heute offen.'],
  k3_selbst: ['Ich hol sie selbst', 'Der Briefkasten am Tor der Villa Seiler quillt über.'],
  k3_band: ['Bitte lächeln, Sie werden gefilmt', 'Die Tankstelle hat als Einzige Strom. Über der Kasse flimmert ein Monitor.'],
  k3_heim: ['Heimgehen', 'Vom Kirchweg aus riecht man frische Erde.'],
  k3_klar: ['Klar!', 'Kinderlachen am Karussell.'],
  k3_ast3: ['Außenstelle 3', 'Aus den Schlitzen des Gullydeckels fällt warmes Licht.'],
  k3_ort: ['Leg sie auf den Ort', 'In der Remise am Hof sitzt Dina, die Augenbinde über den Augen.'],
  k3_bus: ['Der Bus um 03:13', 'Fahrplan an der Bushaltestelle: „03:13 – nur für Kinder“.'],
  zayn: ['Hast du dich an mich erinnert?', 'Rote Wolle an einem Zaunpfahl hinter Nr. 7.', true],
  cleo: ['Eine für sieben', 'Whiskey hat etwas im Schnabel.', true],
  geh_steine: ['Warm wie eine Hand', 'Kleine Steine, die im Dunkeln glimmen. Mach das Licht aus.'],
  k3_ja: ['Ja.', 'Im Briefkasten von Nr. 2 liegt eine neue Postkarte. Sie ist trocken.'],
  k3_stein: ['Schläft wie ein Stein', 'Nr. 8: Frau Aydın steht am Fenster und rührt sich nicht.'],
  k3_fehlt: ['Damit keiner fehlt', 'Vor Nr. 6 flüstert ein Kind. Es zählt.'],
  kb_naepfe: ['Siebzehn Näpfe', 'Vier Katzen sitzen in einer Reihe auf dem Zaun und starren hinter die Bushaltestelle.', true],
  k3_fuesse: ['Hinter deinen Füßen', 'Papierrascheln hinter dir. Kleine Schritte, weg.', true],
  k3_kerben: ['Zweiundvierzig Kerben', 'Justins Lager in der Scheune. Das Stroh ist warm.'],
};
function neben3_k3() { return typeof kap === 'function' ? kap() === 3 : ch3.on; }
function neben3_uk5() { if (typeof ch3.uk === 'number') return ch3.uk >= 5; return !!ch3.met; } // AP-17 setzt ch3.uk (Unterkapitel); Rückfall: Justin ist da
function neben3_frei() { if (typeof kapitel3_nebenOffen === 'function') return neben3_k3() && kapitel3_nebenOffen(); return neben3_k3() && ch3.on && !ch3.lampsOff && (ch3.part === 'town' || ch3.part === 'canal') && neben3_uk5(); } // AP-17: kapitel3_nebenOffen()
function neben3_offen(k) { const q = story.side[k]; return neben3_frei() && !!q && q.state !== 'done' && q.state !== 'zu'; }
function neben3_start(k, karte) { const q = story.side[k]; if (!q || q.state === 'zu') return; if (karte && !q.karte) q.karte = karte; if (q.state === 'hidden') sideStart(k); }
function neben3_desc(k, desc) { const q = story.side[k]; if (q && q.state !== 'done' && q.state !== 'zu') { q.desc = desc; try { updateSideInfo(); } catch (e) {} } }
function neben3_fertig(k, desc) { const q = story.side[k]; if (!q || q.state === 'done') return; if (q.state === 'zu') q.state = 'active'; sideDone(k, desc); neben3_merk(k); neben3_save(); }
function neben3_merk(k, v = true) { if (!ch3.side || typeof ch3.side !== 'object') ch3.side = {}; ch3.side[k] = v; }
function neben3_hat(k) { return !!(ch3.side && ch3.side[k]); }
function neben3_rh(id, luke, ms = 4200) { const neu = !(ch3.armorHints && ch3.armorHints.has(id)); if (typeof justin_rh === 'function') justin_rh(id); else { if (!ch3.armorHints) ch3.armorHints = new Set(); ch3.armorHints.add(id); }
  if (neu && luke) setTimeout(() => subtitle(luke, ms, 'LUKE'), 400); return neu; }
function neben3_save() { if (typeof saveGame === 'function' && state.started && !state.ending) try { saveGame(typeof curChapter === 'function' ? curChapter() : 3); } catch (e) {} }
// Register: vorhandene Schlüssel umbenennen (zayn, cleo, geh_steine, kb_naepfe gibt es schon), fehlende anlegen – vor dem Laden des Spielstands
function neben3_register() { for (const [k, [title, desc]] of Object.entries(NEBEN3)) { const q = story.side[k]; if (q) { q.title = title; if (q.state === 'hidden') q.desc = desc; } else story.side[k] = { title, desc, state: 'hidden', kap: 3 }; } }
// Mit der vierten Laterne: alle offenen Kap.-3-Aufgaben schließen (außer den vier, die weiterlaufen); Glocken-Joker verfällt
function neben3_schliessen() { const S = neben3_S; if (S.zu) return; S.zu = true;
  for (const [k, def] of Object.entries(NEBEN3)) { if (def[2]) continue; const q = story.side[k]; if (!q || q.state !== 'active') continue; q.state = 'zu'; q.desc = q.desc.replace(/\s*\(Die Nacht ist vorbei\.\)$/, '') + ' (Die Nacht ist vorbei.)'; }
  if (ch3.bell) { ch3.bell = false; neben3_merk('glocke', 'verfallen'); }
  try { updateSideInfo(); } catch (e) {} }
// ---------------------------------------------------------------------  Spielstand (Schritte der Aufgaben in diesem Modul)
MOD_SAVE.push(['neben3', () => ({ st: neben3_S.st }), v => { if (v && v.st && typeof v.st === 'object') Object.assign(neben3_S.st, v.st); neben3_S.nachLaden = true; }]);
neben3_S.st = {};
const neben3_st = k => neben3_S.st[k] || (neben3_S.st[k] = {});
const _n3v = new THREE.Vector3(), _n3v2 = new THREE.Vector3();
function neben3_blick(x, y, z, cos = .9) { camera.getWorldDirection(_n3v); _n3v2.set(x - camera.position.x, y - camera.position.y, z - camera.position.z).normalize(); return _n3v.dot(_n3v2) > cos; }
function neben3_nah(x, z, r) { return Math.hypot(player.pos.x - x, player.pos.z - z) < r; }
function neben3_justinDa(r = 14) { return typeof justin !== 'undefined' && justin.g && justin.g.position.y > -100 && ch3.met && !(typeof justin_S !== 'undefined' && justin_S.gone) && jDist() < r; }
function neben3_luke(t, ms = 3600) { return say([[t, ms, 'LUKE']]); }
async function neben3_sag(zeilen) { for (const z of zeilen) { if (typeof z === 'function') await z(); else await say([z]); } }
// Glockenschlag (Synthese wie ausbau_nord_bellToll, an beliebiger Stelle; Innenräume liegen weit außerhalb der Welt)
function neben3_glockeTon(x, y, z, gain = 1, ref = 14) { if (!Audio.ctx) return; if (Audio.glocke && Audio.glocke(x, y, z, 138, gain, ref)) return; const d = Audio.at(x, y, z, ref); // Aufnahme (Modul klang), sonst Synthese
  [[.5, .5, 7], [1, .9, 5.5], [1.19, .35, 4], [1.5, .3, 3.2], [2, .45, 2.6], [2.52, .15, 1.8], [3, .12, 1.4]].forEach(([m, a, dur]) => { const o = Audio.osc('sine', 138 * m, 0, dur + .2); Audio.env(o, a * .32 * gain, .004, dur, 0, d); });
  const n = Audio.noise(false), bp = Audio.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 3; n.connect(bp); Audio.env(bp, .12 * gain, .002, .15, 0, d); n.stop(Audio.ctx.currentTime + .5); }

// ---------------------------------------------------------------------  Glocken-Joker (ch3.bell): Fang abfangen, 17 s Erstarren
function neben3_frost() { return neben3_S.frostT > 0; }
function neben3_glockeFang() {
  const S = neben3_S; if (S.frostT > 0) return true; if (!ch3.bell || ch3.lampsOff) return false;
  ch3.bell = false; neben3_merk('glocke', 'benutzt'); S.frostT = 17; neben3_save(); if (typeof kapitel3_erstarren === 'function') kapitel3_erstarren(17);
  if (typeof ausbau_nord_bellToll === 'function') ausbau_nord_bellToll(); else neben3_glockeTon(player.pos.x, 12, player.pos.z + 20, 1.2, 30);
  glitchV = .5; if (typeof spannung_mark === 'function') try { spannung_mark('welt2'); } catch (e) {}
  if (neben3_justinDa(18)) setTimeout(() => subtitle('„Wenn die Glocke so schlägt, bleibt sie stehen und hört hin. Wie ein Kind, das seinen Namen hört.“', 5200, JS), 1800);
  if (typeof story !== 'undefined') story.items = story.items.filter(k => k !== 'n3_glocke'); return true; }
function neben3_joker() { ch3.bell = true; neben3_merk('glocke', 'frei'); modItem('n3_glocke', 'Die Glocke', 'Drei, Pause, dreizehn. Einmal in dieser Nacht.', 'key'); addItem('n3_glocke'); questPop('JOKER', 'Die Glocke'); neben3_save(); }
// Basis-Jagd (Graukind auf der Straße): Joker vor dem Fang, während des Erstarrens steht sie still
function neben3_jagdHuelle() { if (neben3_S.huelle || typeof greyUpdate !== 'function') return; neben3_S.huelle = true; const alt = greyUpdate;
  greyUpdate = function (dt) { if (neben3_S.frostT > 0) return; if (ch3.bell && hunt.on && grey.visible && Math.hypot(player.pos.x - grey.position.x, player.pos.z - grey.position.z) < 1.35 && neben3_glockeFang()) return; return alt(dt); }; }

// ---------------------------------------------------------------------  „Hinter deinen Füßen“ (Orts-Zettel 1–12 in Kapitel 3; RH-11 liegt im Orts-Zettel „Hof“, beobachter.js)
function neben3_fuesse(dt) { const S = neben3_S; S.fT = (S.fT || 0) - dt; if (S.fT > 0 || typeof beob_S === 'undefined' || typeof BEOB_ORTE === 'undefined') return; S.fT = 1;
  const q = story.side.k3_fuesse; if (!q || q.state === 'done') return; const orte = BEOB_ORTE.filter(o => !(typeof BEOB_WALD !== 'undefined' && BEOB_WALD[o.id])), n = orte.filter(o => beob_S.found.has(o.id)).length;
  if (!n) return; if (q.state === 'hidden') { if (!neben3_k3()) return; neben3_start('k3_fuesse'); }
  const d = `Papierrascheln hinter dir. Zettel an Orten: ${n} / ${orte.length}.`; if (q.desc !== d) neben3_desc('k3_fuesse', d);
  if (n >= orte.length) neben3_fertig('k3_fuesse', `Alle ${orte.length} Orte im Dorf. Die übrigen liegen im Wald.`); }

// =====================================================================  2 · „Zähl bis siebzehn, Augen zu“ – Kapelle St. Martin, innen (Raum aus kirchberg.js)
// Fenster (acht Felder, von hinten beleuchtet über das Material – keine neue Lichtquelle; RH-6: Lampe aus → nur Kreis in Feld 2–4 und das Schimmernde in Feld 7),
// Kirchenführer, Sakristei (Z-11, Sühnebrief, Gemälde-Zettel), Gesangbuch am Lesepult, Turmraum mit Glockenseil (Joker).
const NEBEN3_FELDER = [
  ['Ein Stern fällt', 'Eine Holzkapelle, an der Glocke drei Striche. Ein Stern fällt in einen Birkenwald.', [['„Drei Striche. Die Glocke hat drei geschlagen.“', 3200, 'DU']]],
  ['Das Kind geht ins Licht', 'Ein Mädchen, barfuß, im Hemd, mit einer Stalllaterne, die größer ist als sie, geht in einen Kreis aus milchigem Glas. Es sieht über die Schulter zurück, den Mund offen. Hinter ihm sechs Kinder mit kleinen Laternen.', [['„Die ruft wem was zu. Über die Schulter. Wie beim Verstecken. Und sechs laufen hinterher.“', 4600, 'DU']]],
  ['Die Frau führt sie heraus', 'Eine Frau mit Laterne, ein schwarzer Vogel auf der Schulter. Sie führt sechs Kinder aus dem Kreis, eins hinter dem anderen, Hand in Hand.', [['„Eine Kette. Die hat sie rausgeholt. Alle sechs. Die Erste nicht.“', 4000, 'DU']]],
  ['Die Frau geht allein hinein', 'Die Frau geht allein zurück in den Kreis. Die Flamme in ihrer Laterne steht kerzengerade, obwohl ihr Haar nach hinten weht.', [['„Sie geht noch mal rein. Für die Erste. Und die Flamme … steht. Hat der Glaser nicht aufgepasst?“', 5000, 'DU']]],
  ['Zwei Hände, ein Riss', 'Nur zwei Hände, groß. Die obere kommt aus einem gezackten Riss im Himmel, die untere aus einem Handschuh. Sie berühren sich nicht mehr, ein Fingerbreit fehlt. Quer durch das Feld läuft ein echter Sprung im Glas, genau durch den Riss.', [['„Zwei Hände. Knapp nicht. Wer hält hier wen?“', 3400, 'DU']]],
  ['Der Ritter am Rand', 'Der Ritter kniet allein am Rand einer Grube, die linke Hand offen nach oben. In der Handfläche ein kleiner halber Mond aus gelbem Glas.', [['Ein halber Mond. In der Hand.', 3000, 'LUKE'], ['Er sieht auf seine eigene linke Hand. Er sagt nichts.', 3400]]],
  ['Drei im Schnee', 'Schnee aus weißem Milchglas. Drei kleine weiße Gestalten mit großen dunklen Augen reichen dem knienden Ritter etwas Flaches, Schimmerndes, so groß wie ein Brustpanzer.', [['„Kinder im Schnee? … Mit solchen Augen hat hier keiner Kinder.“', 4000, 'DU']]],
  ['Der Laternenzug', 'Das Dorf mit Laternen, eine lange Reihe. Ganz vorn ein kleines Mädchen mit einer Stalllaterne, die größer ist als sie.', [['„Das Laternenfest. Und vorneweg … die aus Feld zwei.“', 3600, 'DU']]]];
const NEBEN3_FW = 512, NEBEN3_FH = 1088, neben3_feld = i => ({ x: 16 + (i & 1) * 248, y: 16 + (i >> 1) * 268, w: 232, h: 252 });
// Bleiglas gemalt: Felder mit Glasstücken, Bleiruten, Figuren; glow = nur das milchige Glas (Kreis in 2–4, das Schimmernde in 7) für RH-6
function neben3_fensterMalen(glow) {
  return kirchberg_cnv(NEBEN3_FW, NEBEN3_FH, (x, W, H) => {
    let rs = 1312; const R = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
    const lead = '#140e0a';
    const milch = (cx, cy, rx, ry) => { const g = x.createRadialGradient(cx - rx * .2, cy - ry * .25, 2, cx, cy, Math.max(rx, ry)); g.addColorStop(0, glow ? 'rgba(235,245,255,1)' : '#eef4f8'); g.addColorStop(.55, glow ? 'rgba(190,215,240,.95)' : '#c9dbe8'); g.addColorStop(.85, glow ? 'rgba(215,190,235,.8)' : '#d8c8e6'); g.addColorStop(1, glow ? 'rgba(170,200,235,.6)' : '#aec6de');
      x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill();
      if (!glow) { x.strokeStyle = lead; x.lineWidth = 5; x.stroke(); x.lineWidth = 2; for (let k = 0; k < 5; k++) { const a = R() * 6.28; x.beginPath(); x.moveTo(cx + Math.cos(a) * rx * .2, cy + Math.sin(a) * ry * .2); x.lineTo(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); x.stroke(); } } };
    if (glow) x.clearRect(0, 0, W, H); else { x.fillStyle = '#0b0806'; x.fillRect(0, 0, W, H); }
    const poly = (pts, fill, lw = 4) => { if (glow) return; x.beginPath(); x.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) x.lineTo(pts[k], pts[k + 1]); x.closePath(); x.fillStyle = fill; x.fill(); x.strokeStyle = lead; x.lineWidth = lw; x.stroke(); };
    const kreis = (cx, cy, r, fill, lw = 3) => { if (glow) return; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fillStyle = fill; x.fill(); x.strokeStyle = lead; x.lineWidth = lw; x.stroke(); };
    const mensch = (cx, by, h, rock, kopf = '#e8c9a0', o = {}) => { const hw = h * .2; poly([cx - hw, by, cx + hw, by, cx + hw * .55, by - h * .7, cx - hw * .55, by - h * .7], rock, 3); kreis(cx + (o.dreh || 0), by - h * .82, h * .14, kopf, 3);
      if (o.barfuss && !glow) { x.fillStyle = '#e8c9a0'; x.fillRect(cx - hw * .6, by, hw * .4, 4); x.fillRect(cx + hw * .2, by, hw * .4, 4); } };
    const laterne = (cx, cy, s, gross) => { if (glow) return; x.fillStyle = gross ? '#f4c24a' : '#f0a830'; x.fillRect(cx - s / 2, cy - s * .7, s, s * 1.2); x.strokeStyle = lead; x.lineWidth = 3; x.strokeRect(cx - s / 2, cy - s * .7, s, s * 1.2); x.beginPath(); x.moveTo(cx - s / 2, cy - s * .7); x.lineTo(cx, cy - s * 1.1); x.lineTo(cx + s / 2, cy - s * .7); x.stroke(); };
    const kinder = ['#7a3a2a', '#3a5a7a', '#6a6a2a', '#5a3a6a', '#2a6a5a', '#8a6a3a'];
    for (let i = 0; i < 8; i++) { const F = neben3_feld(i); x.save(); x.translate(F.x, F.y); x.beginPath(); x.rect(0, 0, F.w, F.h); x.clip(); const w = F.w, h = F.h;
      if (!glow) { const bg = [['#0f1c3e', '#1d2f5c'], ['#1a1238', '#2c1f52'], ['#12243a', '#27405a'], ['#1b1432', '#34284e'], ['#4a1410', '#7a2a18'], ['#26282c', '#3e4146'], ['#b8c0c8', '#e4e8ec'], ['#15203a', '#28385a']][i];
        const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]); x.fillStyle = g; x.fillRect(0, 0, w, h);
        for (let k = 0; k < 14; k++) { x.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '0,0,0'},${.03 + R() * .07})`; x.beginPath(); const px = R() * w, py = R() * h; x.moveTo(px, py); for (let m = 0; m < 4; m++) x.lineTo(px + (R() - .5) * 110, py + (R() - .5) * 110); x.closePath(); x.fill(); x.strokeStyle = 'rgba(18,12,8,.55)'; x.lineWidth = 2; x.stroke(); } }
      if (i === 0) { poly([18, 230, 18, 150, 50, 118, 82, 150, 82, 230], '#6a3a1c'); poly([38, 150, 38, 96, 62, 96, 62, 150], '#5a3016'); kreis(50, 112, 9, '#d8a83a');
        if (!glow) { x.strokeStyle = '#f2ecd8'; x.lineWidth = 3; for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(66 + k * 7, 104); x.lineTo(66 + k * 7, 120); x.stroke(); } }
        poly([150, 70, 214, 26, 222, 36, 160, 84], '#f0d060', 2); poly([196, 28, 204, 12, 212, 28, 228, 30, 216, 40, 220, 56, 204, 46, 190, 56, 194, 40, 182, 30], '#fff0a0', 3);
        for (let k = 0; k < 6; k++) { const bx = 118 + k * 18; poly([bx, 250, bx, 150 + (k % 2) * 16, bx + 7, 150 + (k % 2) * 16, bx + 7, 250], '#ecebe4', 2); if (!glow) { x.fillStyle = '#1a1a1a'; for (let m = 0; m < 4; m++) x.fillRect(bx, 170 + m * 18 + k * 2, 7, 3); } } }
      else if (i === 1) { milch(160, 128, 64, 92); mensch(100, 226, 64, '#f2eee6', '#e8c9a0', { dreh: -6, barfuss: true }); laterne(126, 180, 26, true); for (let k = 0; k < 6; k++) { mensch(18 + k * 12, 236, 30, kinder[k]); laterne(24 + k * 12, 214, 7); } }
      else if (i === 2) { milch(236, 110, 74, 110); mensch(118, 234, 110, '#2c5a3a'); laterne(146, 160, 18); poly([98, 128, 108, 118, 120, 124, 114, 132], '#0a0a0a', 2); for (let k = 0; k < 6; k++) mensch(92 - k * 14, 238, 34, kinder[k]); }
      else if (i === 3) { milch(140, 118, 86, 112); mensch(120, 236, 108, '#2c5a3a');
        if (!glow) { x.strokeStyle = '#5a3418'; x.lineWidth = 4; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(114, 142 + k * 3); x.quadraticCurveTo(90, 136 + k * 5, 74, 146 + k * 6); x.stroke(); } }
        laterne(150, 170, 18); if (!glow) { x.fillStyle = '#fffbe8'; x.beginPath(); x.ellipse(150, 136, 4, 16, 0, 0, 7); x.fill(); } }
      else if (i === 4) { poly([0, 0, w, 0, w, 58, 170, 70, 150, 44, 118, 76, 96, 40, 70, 66, 40, 50, 0, 64], '#2a0c08'); poly([96, 62, 132, 62, 128, 118, 100, 118], '#e8c9a0'); for (let k = 0; k < 4; k++) poly([100 + k * 7, 118, 106 + k * 7, 118, 106 + k * 7, 140, 100 + k * 7, 140], '#e8c9a0', 2);
        poly([92, 244, 136, 244, 132, 190, 96, 190], '#6a6a6a'); for (let k = 0; k < 4; k++) poly([98 + k * 8, 190, 104 + k * 8, 190, 104 + k * 8, 162, 98 + k * 8, 162], '#7a7a7a', 2);
        if (!glow) { x.strokeStyle = 'rgba(250,250,250,.85)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(0, 96); x.lineTo(40, 88); x.lineTo(70, 104); x.lineTo(112, 150); x.lineTo(150, 146); x.lineTo(190, 170); x.lineTo(w, 164); x.stroke(); } }
      else if (i === 5) { poly([120, 250, 230, 250, 230, 214, 180, 200, 140, 210], '#07080a'); mensch(80, 236, 86, '#5c5f64', '#6a6c70'); poly([96, 170, 118, 150, 124, 156, 104, 176], '#5c5f64', 3);
        if (!glow) { x.fillStyle = '#f2d040'; x.beginPath(); x.arc(118, 146, 7, PI * .5, PI * 1.5); x.fill(); x.strokeStyle = lead; x.lineWidth = 2; x.stroke(); } }
      else if (i === 6) { if (!glow) { x.fillStyle = '#e9ecef'; x.fillRect(0, 150, w, h - 150); }
        for (let k = 0; k < 3; k++) { poly([28 + k * 30, 238, 48 + k * 30, 238, 44 + k * 30, 190, 32 + k * 30, 190], '#f4f6f8', 3); kreis(38 + k * 30, 176, 13, '#f4f6f8', 3); if (!glow) { x.fillStyle = '#060606'; x.beginPath(); x.ellipse(33 + k * 30, 176, 4, 6, -.3, 0, 7); x.ellipse(43 + k * 30, 176, 4, 6, .3, 0, 7); x.fill(); } }
        milch(108, 150, 40, 18); mensch(186, 238, 80, '#5c5f64', '#6a6c70'); }
      else if (i === 7) { for (let k = 0; k < 5; k++) poly([k * 50, 150, k * 50, 100, k * 50 + 22, 78, k * 50 + 44, 100, k * 50 + 44, 150], ['#3a2a1c', '#2e2418', '#44301e', '#352818', '#3e2c1a'][k], 3);
        if (!glow) for (let k = 0; k < 16; k++) { x.fillStyle = '#f6b640'; x.beginPath(); x.arc(212 - k * 13, 188 - Math.sin(k * .7) * 6, 4, 0, 7); x.fill(); }
        mensch(208, 240, 44, '#f2eee6', '#e8c9a0', { barfuss: true }); laterne(222, 214, 18, true); }
      x.restore(); if (!glow) { x.strokeStyle = lead; x.lineWidth = 9; x.strokeRect(F.x, F.y, F.w, F.h); } }
    if (!glow) { x.strokeStyle = '#1b1510'; x.lineWidth = 14; x.strokeRect(4, 4, W - 8, H - 8); const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, 'rgba(255,255,255,.05)'); g.addColorStop(.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(255,240,220,.05)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  }); }

// Rätsel-/Blickfenster (Fenster, Mappe, Karte): Papier/Glas-Anmutung
{ const st = document.createElement('style'); st.id = 'neben3css'; st.textContent = `
  #puzzle .box.n3box { width: min(980px, 96vw); max-width: 980px; padding: 26px 30px 22px; background: linear-gradient(170deg, #1b1612, #0e0b09); }
  .n3 h3 { font: 22px Georgia, serif; letter-spacing: .12em; color: #d8c8a8; margin: 0 0 12px; text-transform: uppercase; }
  .n3 .reihe { display: flex; gap: 22px; align-items: flex-start; }
  .n3 .bild { position: relative; flex: none; height: min(66vh, 620px); box-shadow: 0 0 0 6px #0a0806, 0 0 40px rgba(160,190,230,.18); }
  .n3 .bild img { display: block; height: 100%; }
  .n3 .feld { position: absolute; cursor: pointer; }
  .n3 .feld:hover { box-shadow: inset 0 0 0 2px rgba(255,236,200,.55); }
  .n3 .feld.ges::after { content: '✓'; position: absolute; right: 4px; top: 2px; font: 13px Georgia, serif; color: rgba(255,236,200,.7); }
  .n3 .txt { flex: 1; font: 17px/1.55 Georgia, serif; color: #d9d0c0; min-height: 200px; }
  .n3 .txt b { display: block; font-size: 15px; letter-spacing: .14em; color: #b89a6a; text-transform: uppercase; margin-bottom: 8px; }
  .n3 .txt i { color: #a8b8c8; } .n3 .txt .luke { margin-top: 14px; color: #f0e6d0; }
  .n3 .blaetter { display: flex; flex-wrap: wrap; gap: 8px; margin: 4px 0 14px; }
  .n3 .reiter { font: 14px "Special Elite", monospace; background: linear-gradient(175deg, #e6dcc0, #cdbf9c); color: #2a2016; padding: 6px 10px 4px; border-radius: 5px 5px 0 0; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,.5); transform: rotate(var(--r, 0deg)); }
  .n3 .reiter.on { background: linear-gradient(175deg, #fff6dc, #e2d4ae); }
  .n3 .blatt { background: linear-gradient(175deg, #ece4cc, #d8cba8); color: #2a241c; padding: 18px 22px; font: 19px/1.5 "Caveat", "Segoe Print", cursive; min-height: 120px; box-shadow: 0 6px 18px rgba(0,0,0,.6); }
  .n3 .blatt u { text-decoration: underline double; text-decoration-color: rgba(30,40,110,.85); }
  .n3 .knoepfe { margin-top: 14px; display: flex; gap: 10px; } .n3 button { font: 15px Georgia, serif; }
`; document.head.appendChild(st); }

const NEBEN3_HUTCH = tint => { const W_ = k => ({ b: `T_${k}_BaseColor.jpg`, n: `T_${k}_Normal.jpg`, r: `T_${k}_Roughness.jpg` }); return { 'Wood-1': { ...W_('Wood-1'), color: tint }, 'Wood-2': { ...W_('Wood-2'), color: tint }, 'Wood-3': { ...W_('Wood-3'), color: tint }, Metal: { ...W_('Metal'), m: 'T_Metal_Metallic.jpg' } }; };
const NEBEN3_STUHL = { chair: { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg' } };
function neben3_hitSuchen(label, x, z, r = 1.2) { return interactables.find(m => { if (m.userData.label !== label) return false; const p = m.getWorldPosition(_n3v); return Math.hypot(p.x - x, p.z - z) < r; }) || null; }

async function neben3_kapelleBau() {
  const S = neben3_S, K = kirchberg_S, R = K.raeume && K.raeume.kapelle; if (!R || S.kap) return !!S.kap;
  const T = THREE, C = KB_RAUM.kapelle, g = R.g, x0 = R.x0, x1 = R.x1, z0 = R.z0, z1 = R.z1, KP = S.kap = { C, R }, put = (o, x, y, z, ry) => kirchberg_setze(o, x, y, z, ry, g);
  // ---- Das Fenster: neu gemalt, von hinten beleuchtet (Material), Glimmschicht für RH-6
  let alt = null; g.traverse(m => { if (m.isMesh && m.material && m.material.map === K.fensterTexInnen) alt = m; }); if (alt) alt.visible = false;
  KP.cnv = neben3_fensterMalen(false); const tex = kirchberg_tex(KP.cnv), glow = kirchberg_tex(neben3_fensterMalen(true));
  KP.fenster = kirchberg_decal(tex, 1.3, 2.75, x1 - .1, 3.3, C.z - 1.5, -PI / 2, { parent: g, emi: 1, rough: .25 });
  KP.glow = new T.Mesh(new T.PlaneGeometry(1.3, 2.75), new T.MeshBasicMaterial({ map: glow, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: .22, fog: false }));
  KP.glow.position.set(x1 - .094, 3.3, C.z - 1.5); KP.glow.rotation.y = -PI / 2; KP.glow.userData.noCol = true; g.add(KP.glow); KP.e = 1; KP.go = .22;
  KP.fp = i => { const F = neben3_feld(i), u = (F.x + F.w / 2) / NEBEN3_FW, v = (F.y + F.h / 2) / NEBEN3_FH; return [x1 - .1, 3.3 + (.5 - v) * 2.75, C.z - 1.5 + (u - .5) * 1.3]; };
  const hf = neben3_hitSuchen('Kapellenfenster', x1 - .3, C.z - 1.5, 1); if (hf) { hf.userData.label = () => kapAb(3) ? 'Das Fenster ansehen' : 'Kapellenfenster'; const a0 = hf.userData.action; hf.userData.action = () => kapAb(3) ? neben3_fensterBlick() : a0(); }
  // ---- Schriftenstand mit zwei laminierten Karten (Heimatverein), rechts neben dem Eingang
  { const st = await kirchberg_fbx('dresser', NEBEN3_HUTCH(0x5a4636), .95); if (st) put(st, x1 - .42, 0, z1 - 1.6, -PI / 2); const ty = st ? kirchberg_top(st, x1 - .42, z1 - 1.6, 3, .95) : .95;
    const karte = (n, zz) => kirchberg_decal(kirchberg_papier({ w: 256, h: 180, bg: '#f2efe6', flecken: 0, zeilen: [['Heimatverein Lost Eyengless', 14, 26, 16, '#3a4a2a', 'Georgia, serif', 0], ['Das Martinsfenster · Karte ' + n, 14, 52, 17, '#222', 'Georgia, serif', 0]],
      fn: (x, w, h) => { x.fillStyle = 'rgba(40,40,40,.5)'; for (let r = 0; r < 6; r++) x.fillRect(14, 70 + r * 16, w - 40 - (r % 3) * 30, 5); const gg = x.createLinearGradient(0, 0, w, h); gg.addColorStop(0, 'rgba(255,255,255,.35)'); gg.addColorStop(.4, 'rgba(255,255,255,0)'); x.fillStyle = gg; x.fillRect(0, 0, w, h); } }), .21, .15, x1 - .45, ty + .004, zz, 0, { rx: -PI / 2, rz: .1 * n, rough: .25, parent: g });
    karte(1, z1 - 1.75); karte(2, z1 - 1.45);
    for (const [dz, s] of [[-.1, .16], [.12, .14]]) { const b = await kirchberg_mod('w_buch', 'model.glb', s, 'max'); if (b) put(b, x1 - .38, ty, z1 - 1.6 + dz + .35, .3 + dz); }
    kirchberg_hit(.6, .5, .8, x1 - .45, ty + .1, z1 - 1.6, 'Kirchenführer lesen', () => neben3_fuehrer()); }
  // ---- Sakristei (Südostecke hinter dem Altar): Trennwände aus demselben Putz, Tür nach Norden
  { const zS = z0 + 2.6, xS = x1 - 2.4; wall('z', xS, z0, zS, R.H, R.wm, [], .12); wall('x', zS, xS, x1, R.H, R.wm, [{ at: x1 - .52, w: .9 }], .12);
    const sch = await kirchberg_mod('wardrobe', 'model.gltf', 2.05); if (sch) put(sch, xS + .45, 0, z0 + .95, PI / 2);
    const ti = await kirchberg_mod('metaltable', 'model.gltf', 0); if (ti) { ti.scale.set(.3, .78, .5); put(ti, x1 - .55, 0, z0 + .75, -PI / 2); }
    const tY = ti ? kirchberg_top(ti, x1 - .55, z0 + .75, 3, .76) : .76;
    { const c = await kirchberg_fbx('chair', NEBEN3_STUHL, .92); if (c) put(c, x1 - 1.2, 0, z0 + .7, -.4); }
    await kirchberg_kram(g, [['stapel', x1 - .55, tY, z0 + .55], ['glas', x1 - .5, tY, z0 + .95], ['kerze', x1 - .7, tY, z0 + .98], ['zeitung', x1 - .8, 0, z0 + 1.9, .6, .7]]);
    kirchberg_licht(R, 0xffb060, .5, 3.6, x1 - .6, 1.3, z0 + 1); // Kerzenstumpf auf dem Tisch
    { const kr = await kirchberg_fbx('cross_hang', { '*': { color: 0x2a2018, rough: .8 } }, .5); if (kr) put(kr, x1 - .115, 1.9, z0 + 1.6, -PI / 2); }
    // Z-11 (vergilbter Aushang) an der Sakristeiwand, Sühnebrief gerahmt neben der Tür, heller Fleck mit Haken und Schreibmaschinenzettel
    if (typeof sammeln_platz === 'function') sammeln_platz('Z-11', { x: xS + .12, y: 1.55, z: z0 + 2.0, ry: PI / 2, stehend: true, ab: 3, label: 'Vergilbter Aushang' });
    const rah = await kirchberg_mod('frame_deco', 'model.gltf', .62); if (rah) put(rah, x1 - 1.35, 1.45, zS - .07, PI);
    kirchberg_decal(kirchberg_papier({ w: 300, h: 380, bg: '#e2d6b4', flecken: 2, zeilen: [['Im Jahr nach der Martinsnacht …', 20, 60, 24, 'rgba(40,30,20,.85)', 'Georgia, serif', 0], ['zur Sühne …', 20, 110, 24, 'rgba(40,30,20,.85)', 'Georgia, serif', 0], ['Er zahlt kein Geld.', 20, 250, 26, 'rgba(40,30,20,.85)', 'Georgia, serif', 0], ['Er zahlt mit Jahren.', 20, 290, 26, 'rgba(40,30,20,.85)', 'Georgia, serif', 0]] }), .36, .46, x1 - 1.35, 1.47, zS - .1, PI, { parent: g });
    kirchberg_hit(.6, .7, .3, x1 - 1.35, 1.45, zS - .25, 'Gerahmte Abschrift', () => neben3_suehne());
    const fleck = kirchberg_tex(kirchberg_cnv(128, 160, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(235,228,210,.55)'; x.fillRect(10, 12, w - 20, h - 24); x.strokeStyle = 'rgba(60,50,40,.25)'; x.lineWidth = 3; x.strokeRect(10, 12, w - 20, h - 24); x.fillStyle = '#3a3026'; x.beginPath(); x.arc(w / 2, 8, 4, 0, 7); x.fill(); }));
    kirchberg_decal(fleck, .8, 1, xS + .065, 1.75, z0 + .8, PI / 2, { alpha: true, parent: g });
    kirchberg_decal(kirchberg_papier({ w: 256, h: 120, bg: '#ece6d6', flecken: 1, zeilen: [['Gemälde „Die Senke“,', 12, 44, 18, 'rgba(40,36,30,.85)', '"Special Elite", "Courier New", monospace', 0], ['an das Amt verliehen.', 12, 70, 18, 'rgba(40,36,30,.85)', '"Special Elite", "Courier New", monospace', 0], ['Rückgabe zugesagt.', 12, 96, 18, 'rgba(40,36,30,.85)', '"Special Elite", "Courier New", monospace', 0]] }), .16, .075, xS + .07, 2.1, z0 + .8, PI / 2, { parent: g });
    kirchberg_hit(.3, .9, 1, xS + .2, 1.85, z0 + .8, 'Heller Fleck an der Wand', () => { neben3_st('kapelle').fleck = 1; openNote('Ein heller Fleck', 'An der Wand ein heller Fleck mit Haken, wo ein Bild hing. Am Haken ein Zettel, Schreibmaschine:\n\n<span style="font-family:\'Special Elite\',monospace">Gemälde „Die Senke“, an das Amt verliehen. Rückgabe zugesagt.</span>\n\n<i>Kein Datum der Rückgabe.</i>', 'k3_gemaelde'); }); }
  // ---- Lesepult mit dem aufgeschlagenen Gesangbuch (Lesepult: kein Modell im Katalog → schmale Kommode)
  { const px = C.x - 1.45, pz = z0 + 2.15; const p = await kirchberg_fbx('dresser', NEBEN3_HUTCH(0x4a3626), 1.12); if (p) { p.scale.x *= .55; put(p, px, 0, pz, 0); } const py = p ? kirchberg_top(p, px, pz, 3, 1.1) : 1.1;
    const b = await kirchberg_mod('w_buch', 'model.glb', .3, 'max'); if (b) { b.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setRGB(.35, .12, .1); } }); put(b, px, py, pz + .02, .05); }
    kirchberg_decal(kirchberg_papier({ w: 320, h: 220, bg: '#e8dcbc', flecken: 1, zeilen: [['Lied 13', 20, 40, 26, 'rgba(30,20,12,.9)', 'Georgia, serif', 0], ['Schlaf, Kind, im Laternenschein,', 20, 84, 22, 'rgba(30,20,12,.85)', 'Georgia, serif', 0], ['der Rab helt Wacht …', 20, 116, 22, 'rgba(30,20,12,.85)', 'Georgia, serif', 0], ['Zähl bis siebzehn, Augen zu.', 20, 190, 22, 'rgba(90,50,20,.85)']] }), .3, .2, px, py + .055, pz + .02, 0, { rx: -PI / 2 + .25, parent: g });
    KP.pult = { x: px, z: pz }; kirchberg_hit(.7, .5, .7, px, py + .1, pz, 'Gesangbuch lesen', () => neben3_gesangbuch()); }
  // ---- Turmraum (Nordwestecke am Eingang): Glockenseil mit drei Knoten, Giselas Zettel
  { const xT = x0 + 1.7, zT = z1 - 2.1; wall('x', zT, x0, xT, R.H, R.wm, [], .12); wall('z', xT, zT, z1, R.H, R.wm, [{ at: z1 - 1.05, w: .9 }], .12);
    const sx = x0 + .8, sz = z1 - 1.05; KP.seil = { x: sx, z: sz, y0: 0, zug: 0 };
    const seilTex = kirchberg_tex(kirchberg_cnv(32, 256, (x, w, h) => { x.fillStyle = '#8a7654'; x.fillRect(0, 0, w, h); for (let i = -h; i < h; i += 7) { x.strokeStyle = i % 14 ? 'rgba(60,45,25,.55)' : 'rgba(200,180,140,.35)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, i); x.lineTo(w, i + w * 1.4); x.stroke(); } for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(${40 + Math.random() * 80},${30 + Math.random() * 60},20,.3)`; x.fillRect(Math.random() * w, Math.random() * h, 1, 2); } }));
    seilTex.wrapS = seilTex.wrapT = T.RepeatWrapping; seilTex.repeat.set(1, 18); const sm = new T.MeshStandardMaterial({ map: seilTex, roughness: 1 });
    const seil = new T.Group(); const strang = new T.Mesh(new T.CylinderGeometry(.016, .016, 5.1, 8), sm); strang.position.y = 3.45; seil.add(strang);
    for (let k = 0; k < 3; k++) { const kn = new T.Mesh(new T.SphereGeometry(.034, 10, 8), sm); kn.scale.y = 1.4; kn.position.y = .95 + k * .35; seil.add(kn); }
    seil.position.set(sx, 0, sz); seil.traverse(m => { m.castShadow = true; m.userData.noCol = true; }); g.add(seil); KP.seil.g = seil;
    kirchberg_decal(kirchberg_papier({ w: 300, h: 220, bg: '#efe8d4', tesa: true, flecken: 1, zeilen: [['Nur zu Gottesdiensten läuten!', 16, 60, 26], ['Nicht zum Spaß. Und NICHT', 16, 100, 26], ['drei und dreizehn.', 16, 136, 26, null, null, 0, 1], ['Das ist kein Witz. – G. R., Küsterin', 16, 190, 22]] }), .3, .22, x0 + .11, 1.5, sz + .55, PI / 2, { parent: g });
    KP.zettelHit = kirchberg_hit(.3, .4, .5, x0 + .25, 1.5, sz + .55, 'Zettel am Seil', () => neben3_giselaZettel()); kirchberg_an(KP.zettelHit, false);
    KP.seilHit = kirchberg_hit(.5, 1.8, .5, sx, 1.1, sz, () => neben3_st('kapelle').seil1 ? 'Am Seil ziehen' : 'Das Glockenseil', () => neben3_seil());
    { const lat = await kirchberg_mod('w_papierlaterne', 'model.glb', .35).catch(() => null); if (lat) put(lat, xT - .3, 0, z1 - .4, .6); }
    await kirchberg_kram(g, [['stapel', x0 + .35, 0, zT + .35], ['zeitung', x0 + 1.2, 0, zT + .5, 1.2, .8]]); }
  // Kleinkram im Kirchenschiff: Gesangbücher auf den Bänken, Staub, Spinnweben (Q-8)
  await kirchberg_kram(g, [['buch', C.x - 1.4, .5, C.z + 2.2, .3], ['buch', C.x + 2, .5, C.z + .9, 1.1], ['buch', C.x - 2.1, .5, C.z - .45, 2.3], ['buch', C.x + 1.2, .5, C.z + 3.55, .8], ['teppich', C.x, 0, z0 + 1.6, 0, .9]]);
  return true; }

function neben3_fensterLore() { const st = neben3_st('kapelle'), ges = st.ges || [];
  let html = ges.slice().sort((a, b) => a - b).map(i => `<b>Feld ${i + 1} · ${NEBEN3_FELDER[i][0]}</b>\n${NEBEN3_FELDER[i][1]}\n<span class="hand">${NEBEN3_FELDER[i][2].filter(l => l[2] === 'DU' || l[2] === 'LUKE').map(l => l[0].replace(/^„|“$/g, '')).join(' ')}</span>`).join('\n\n');
  if (ch3.room3) html += '\n\n<span class="hand">Feld 5 ist keine Hand Gottes. Feld 6 ist keine Gabe. Die untere Hand ist offen. Das ist die, die aufgegangen ist.</span>';
  const e = { key: 'k3_fenster', title: 'Das Fenster', html }, i = story.lore.findIndex(l => l.key === 'k3_fenster'); if (i >= 0) story.lore[i] = e; else story.lore.push(e); }
function neben3_fensterBlick() {
  const S = neben3_S, KP = S.kap; if (!KP) return; if (!flashOn) return toast('Das Glas leuchtet von hinten. Für die Einzelheiten brauchst du die Taschenlampe.', 3600);
  const st = neben3_st('kapelle'); st.ges = st.ges || []; if (neben3_frei()) neben3_start('k3_kapelle');
  const url = KP.url || (KP.url = KP.cnv.toDataURL('image/jpeg', .88));
  const felder = NEBEN3_FELDER.map((f, i) => { const F = neben3_feld(i); return `<div class="feld${st.ges.includes(i) ? ' ges' : ''}" data-i="${i}" style="left:${F.x / NEBEN3_FW * 100}%;top:${F.y / NEBEN3_FH * 100}%;width:${F.w / NEBEN3_FW * 100}%;height:${F.h / NEBEN3_FH * 100}%"></div>`; }).join('');
  openPuzzle(`<div class="n3"><h3>Das Martinsfenster</h3><div class="reihe"><div class="bild"><img src="${url}" alt="">${felder}</div><div class="txt"><b>Acht Felder</b>Zwei Spalten, vier Reihen. Gelesen wie ein Bilderbogen. Jedes Feld einzeln.</div></div></div>`, box => {
    box.classList.add('n3box'); const txt = box.querySelector('.txt');
    box.querySelectorAll('.feld').forEach(el => el.onclick = e => { e.stopPropagation(); const i = +el.dataset.i, f = NEBEN3_FELDER[i]; Audio.paper && Audio.paper();
      txt.innerHTML = `<b>Feld ${i + 1} · ${f[0]}</b>${f[1]}` + f[2].map(l => `<div class="luke">${l[2] === 'LUKE' ? '<i>' + l[0] + '</i>' : l[2] ? l[0] : '<i>' + l[0] + '</i>'}</div>`).join('');
      if (!st.ges.includes(i)) { st.ges.push(i); el.classList.add('ges'); neben3_fensterLore(); neben3_kapCheck();
        if (i === 2 && typeof whiskey_mimic === 'function' && typeof whiskey_S !== 'undefined' && whiskey_S.g) try { whiskey_mimic('gurren', { force: true, at: KP.fp(2).map((v, k) => k === 0 ? v + .4 : v) }); } catch (er) {} } }); });
  ui.onClose = () => { const neu = st.ges.filter(i => !(st.gesagt || []).includes(i)); st.gesagt = (st.gesagt || []).concat(neu); if (neu.length) neben3_sag(NEBEN3_FELDER[neu[neu.length - 1]][2]); }; }
async function neben3_fuehrer() { const st = neben3_st('kapelle'); if (neben3_frei()) neben3_start('k3_kapelle');
  openNote('Kirchenführer · Karte 1', '<i>Laminiert. Heimatverein.</i>\n\nDas Martinsfenster (15. Jh.), gestiftet von den sechs alten Familien. Feld 1: Der Stern von Tours. Feld 2: Die Kinder folgen dem Licht des Glaubens. Feld 3: Eine Stifterin führt die Kinder zur Kirche. Feld 4: Die Stifterin kehrt zum Gebet zurück.\n\nFotografieren mit Blitz verboten.', 'k3_fuehrer1');
  openNote('Kirchenführer · Karte 2', 'Feld 5: Die Hand Gottes reicht aus dem Himmel (Sprung: Sturmschaden, 1890, bewusst nicht erneuert). Feld 6: Martin öffnet die Hand zur Gabe. Feld 7: Engel bringen dem Heiligen den Mantel. Feld 8: Der Martinszug.\n\nDer Heimatverein dankt für Ihre Spende.', 'k3_fuehrer2', async () => {
    if (st.fuehrer) return; st.fuehrer = 1; await say([['„Blitz verboten. Ich hab eine Taschenlampe. Das ist Dauerlicht. Das ist was ganz anderes.“', 4600, 'DU']]); await wait(500); await say([['„Engel. Mit Mantel. Klar.“', 2600, 'DU']]);
    if (neben3_justinDa(12)) { await wait(700); await say([['„Sie haben ein Fest daraus gemacht.“', 3200, JS]]); } neben3_kapCheck(); }); }
function neben3_suehne() { const st = neben3_st('kapelle'); if (neben3_frei()) neben3_start('k3_kapelle');
  const html = 'Gerahmte Abschrift neben der Tür. Sie gehört zum Sühnekreuz draußen.\n\n<span style="font-family:Georgia,serif">Im Jahr nach der Martinsnacht setzt der Ritter vom Hohen Abgrund dies Kreuz vor die Kapelle,\nzur Sühne für das, was ihm in jener Nacht aus der Hand gegangen ist.\nEr gelobt vor dem Grafen und den sechs Familien, zu suchen, bis er findet.\nEr zahlt kein Geld. Er zahlt mit Jahren.</span>' + (ch3.room3 ? '\n\n<span class="hand">Aus der Hand gegangen. Wörtlich.</span>' : '');
  openNote('Der Sühnebrief', html, 'k3_suehnebrief', () => { if (!st.suehne) { st.suehne = 1; subtitle('Aus der Hand gegangen. Die Frau. Das Kind. Alles.', 4200, 'LUKE'); } neben3_kapCheck(); }); }
function neben3_gesangbuch() { const st = neben3_st('kapelle'), S = neben3_S; if (neben3_frei()) neben3_start('k3_kapelle');
  openNote('Das Gesangbuch', '<i>Handgeschrieben, auf dem Lesepult aufgeschlagen.</i>\n\n<i>Lied 13 · Der Ritterin Schlaflied, wie sie es sang. Aus dem Seelbuch abgeschrieben.</i>\n\n<span style="font-family:Georgia,serif">Schlaf, Kind, im Laternenschein, / der Rab helt Wacht, du bist nit allein. / Ich zel die Schleg, ich zel die Zeit, / und wo du hingest, bin ich nit weit.\n\nSchlaf, Kind, die Flamm steht gerad, / kein Wind, der sie zu leschen hat. / Und fellst du weit, und fellst du tief, / ich kom dich holen, eh du rief’st.\n\nIch find dich überall. – Ist das wahr? – Ja.</span>\n\n<i>Darunter, braune Tinte, andere Hand:</i> <span class="hand" style="color:#5a3418">Die Kinder, so wiederkamen, singen es anders. Am End „Such mich, Kind“, und danach: Zähl bis siebzehn, Augen zu.</span>\n\n<i>Bleistift:</i> <span class="hand" style="color:#555">Das Dorf singt „Such mich“. Sie hat „Ich find dich“ gesungen. Wer hat das Lied umgedreht? – B. V.</span>', 'k3_gesangbuch', async () => {
    if (st.buch) return; st.buch = 1; await say([['„Sie zählt bis siebzehn zu dem Lied, das ihre Mama ihr vorgesungen hat.“', 4600, 'DU']]); neben3_kapCheck();
    if (neben3_justinDa(12) && S.kap) { justin.look = false; const P = S.kap.pult; jWalk(P.x + .15, P.z + 1.05, () => { justin.g.rotation.y = 0; S.summen = { t: 0 }; }); } }); }
// Justin summt die ersten fünf Töne (E D C H C), so leise, dass der Untertitel nur „(summt)“ zeigt
function neben3_summen() { if (!Audio.ctx) return; const g = justin.g.position, d = Audio.at(g.x, 1.6, g.z, 1.6); [659.3, 587.3, 523.3, 493.9, 523.3].forEach((f, k) => { const o = Audio.osc('triangle', f / 2, k * .62, .7); const lp = Audio.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; o.connect(lp); Audio.env(lp, .05, .08, .55, k * .62, d); }); subtitle('(summt)', 3400, JS); }
function neben3_giselaZettel() { openNote('Zettel am Glockenseil', '<span class="hand">Nur zu Gottesdiensten läuten!\nNicht zum Spaß. Und NICHT drei und dreizehn.\nDas ist kein Witz. – G. R., Küsterin</span>', 'k3_glockenzettel'); }
// Glockenseil: beim ersten Anfassen zieht es oben jemand einmal an (Schreck 2); danach 3 · Pause · 13 = Joker (einmal im Kapitel)
async function neben3_seil() {
  const S = neben3_S, KP = S.kap, st = neben3_st('kapelle'); if (!KP || state.talking) return; if (neben3_frei()) neben3_start('k3_kapelle');
  const glocke = () => neben3_glockeTon(player.pos.x + 1, player.pos.y + 7, player.pos.z, .9, 10);
  if (!st.seil1) { st.seil1 = 1; state.talking = true; KP.seil.zug = -.55; await wait(120); glocke(); shake = .02; await wait(4200); state.talking = false; kirchberg_an(KP.zettelHit, true); if (typeof spannung_mark === 'function') try { spannung_mark('welt2'); } catch (e) {} return; }
  if (!neben3_k3() || ch3.lampsOff) { KP.seil.zug = .35; return toast('Das Seil gibt nach. Oben rührt sich nichts.', 2600); }
  const t = performance.now() / 1000; KP.seil.zug = .38; glocke(); S.zuege = (S.zuege || []).filter(z => t - z < 40); S.zuege.push(t); S.zugPruef = 2.6; }
function neben3_seilPruefen() { const S = neben3_S, z = S.zuege || []; S.zuege = []; if (z.length !== 16 || neben3_hat('glocke')) return;
  const gaps = z.slice(1).map((v, i) => v - z[i]); const ok = gaps[2] > 1.6 && gaps.every((g, i) => i === 2 || g < 1.6); if (!ok) return;
  neben3_joker(); if (neben3_justinDa(20)) setTimeout(() => subtitle('„Wenn die Glocke so schlägt, bleibt sie stehen und hört hin. Wie ein Kind, das seinen Namen hört.“', 5200, JS), 2200); neben3_kapCheck(); }
function neben3_kapCheck() { const st = neben3_st('kapelle'), q = story.side.k3_kapelle; if (!q || q.state === 'done') return;
  const n = [(st.ges || []).length >= 4, !!st.fuehrer, typeof sammeln_hatZ === 'function' && sammeln_hatZ(11), !!st.suehne, !!st.buch];
  neben3_desc('k3_kapelle', `Fenster (${(st.ges || []).length}/8) · Kirchenführer · Sakristei · Gesangbuch · Glockenseil`);
  if (n.every(Boolean)) neben3_fertig('k3_kapelle', 'Sie zählt bis siebzehn zu dem Lied, das ihre Mama ihr vorgesungen hat.'); neben3_merk('fenster'); }
// Takt in der Kapelle: Fensterglühen (RH-6), Seil, Justin summt, Justin kommt mit hinein
function neben3_kapTick(dt, t) {
  const S = neben3_S, KP = S.kap; if (!KP) return; const drin = kirchberg_S.inRaum === 'kapelle', st = neben3_st('kapelle');
  if (drin !== S.kapDrin) { S.kapDrin = drin; if (drin) neben3_kapRein(); else if (S.jIn) { S.jIn = false; if (typeof justin !== 'undefined' && justin.g) { jPlace(KB_KAP.x + 1.6, 76.4, PI); justin.look = true; } } }
  const rh6 = drin && !flashOn && neben3_k3(); const eZ = rh6 ? .05 : kapAb(3) ? (ch3.on && !ch3.lampsOff ? 1.05 : .5) : .35, gZ = rh6 ? 1 : .2;
  KP.e += (eZ - KP.e) * Math.min(1, dt * 1.6); KP.go += (gZ - KP.go) * Math.min(1, dt * 1.6); KP.fenster.material.emissiveIntensity = KP.e; KP.glow.material.opacity = KP.go;
  if (!drin) return;
  if (rh6 && !neben3_hat('rh6') && neben3_frei() && Math.hypot(player.pos.x - (KP.R.x1 - .1), player.pos.z - (KB_RAUM.kapelle.z - 1.5)) < 7.5) { // beide Stellen ansehen
    const a = [1, 2, 3].some(i => { const p = KP.fp(i); return neben3_blick(p[0], p[1], p[2], .985); }), b = (() => { const p = KP.fp(6); return neben3_blick(p[0], p[1] + .08, p[2], .985); })();
    if (a) st.rhA = (st.rhA || 0) + dt; if (b) st.rhB = (st.rhB || 0) + dt;
    if (st.rhA > .5 && st.rhB > .5 && !state.talking) { neben3_merk('rh6'); neben3_rh('RH-6'); say([['„Licht aus, und nur zwei Sachen leuchten. Das Loch, in das die Kinder gehen. Und das, was die drei ihm geben. Das ist dasselbe Zeug.“', 6400, 'DU']]); } }
  const sl = KP.seil; if (sl && sl.g) { sl.zug += (0 - sl.zug) * Math.min(1, dt * 5); sl.g.position.y = sl.zug; }
  if (S.zugPruef > 0) { S.zugPruef -= dt; if (S.zugPruef <= 0) neben3_seilPruefen(); }
  if (S.summen && KP.pult) { if (neben3_nah(KP.pult.x, KP.pult.z + .3, 2.4) && !state.talking) S.summen.t += dt; else S.summen.t = 0; if (S.summen.t > 6) { S.summen = null; neben3_summen(); } }
  if (ch3.room3 && !st.lore3) { st.lore3 = 1; neben3_fensterLore(); const i = story.lore.findIndex(l => l.key === 'k3_suehnebrief'); if (i >= 0 && !/Wörtlich/.test(story.lore[i].html)) story.lore[i].html += '\n\n<span class="hand">Aus der Hand gegangen. Wörtlich.</span>'; } }
async function neben3_kapRein() { const S = neben3_S, KP = S.kap, R = KP.R; if (!neben3_k3() || !ch3.on) return; if (neben3_frei()) neben3_start('k3_kapelle');
  if (!neben3_justinDa(26)) return; S.jIn = true; jPlace(KB_RAUM.kapelle.x + .4, R.z1 - .9, PI); justin.look = true;
  const st = neben3_st('kapelle'); if (st.jBank) return; st.jBank = 1; await wait(900); await say([['„In die Kapelle darf jeder.“', 2800, JS]]);
  jWalk(KB_RAUM.kapelle.x - 1.75, R.z1 - 2.25, async () => { justin.g.rotation.y = PI; await wait(700); Audio.creak(.55); shake = .006; await wait(1500); Audio.creak(.3); jWalk(KB_RAUM.kapelle.x - .6, R.z1 - 2.4, () => { justin.look = true; }); }); }

// =====================================================================  3 · „Die dreizehnte Predigt“ (N-06) – Pfarrhaus-Studierzimmer (kirchberg.js) → Martinsnische
const NEBEN3_PREDIGT = [ // [Reiter, Zeile mit dem doppelt unterstrichenen Wort (Wort in <u>), Randnotiz]
  ['Advent', '„… <u>WO</u> man wartet: am Fenster oder am Rand.“'], ['Weihnachten', '„Es ist <u>DER</u> älteste Trick der Welt, dass man Kinder in Ställe legt, wo keiner sucht.“'],
  ['Epiphanias', '„Der <u>BETTLER</u> folgte niemandem, und er war der Einzige, der ankam.“'], ['Passion', '„Wer nachts wach liegt und <u>FRIERT</u>, weiß mehr über diese Woche als jeder, der schläft.“'],
  ['Ostern', '„Was drin <u>LIEGT</u>, ist manchmal nicht das, was wir hineingelegt haben.“', 'Peter Kranz. Grab fest wie ein Deckel.'], ['Pfingsten', '„Sie verstanden einander, <u>WAS</u> auch immer sie sprachen.“'],
  ['Trinitatis', '„<u>DAS</u> Dorf besteht aus sechs Familien und einem Fest.“'], ['Erntedank', '„Wir danken für das, was das <u>DORF</u> hergibt. Ich sage seit zwanzig Jahren nicht, was.“'],
  ['Reformation', '„Ich kann <u>NICHT</u> anders. Doch, ich kann. Ich tu’s nur nicht.“'], ['Martini', '„Martin teilte den Mantel, ohne zu <u>LESEN</u>, wer da fror.“'],
  ['Buß- und Bettag', '„Wer Buße <u>WILL</u>, muss erst wissen, was er getan hat.“'], ['Ewigkeitssonntag', '„Ich nenne keine Namen. <u>AMEN</u>.“']];
const NEBEN3_MAPPE_LAGE = [0, 1, 2, 4, 3, 5, 6, 7, 8, 9, 10, 11]; // so liegen die Blätter in der Mappe: Passion hinter Ostern
async function neben3_pfarrBau() {
  const S = neben3_S, K = kirchberg_S, R = K.raeume && K.raeume.pfarrhaus; if (!R || S.pfarr) return !!S.pfarr;
  const T = THREE, C = KB_RAUM.pfarrhaus, g = R.g, x0 = R.x0, x1 = R.x1, z0 = R.z0, z1 = R.z1, PF = S.pfarr = { C, R }, put = (o, x, y, z, ry) => kirchberg_setze(o, x, y, z, ry, g);
  // Schachtisch am Fenster: Weiß am Zug (Schachbrett: kein Modell im Katalog → Abziehbild), darunter der Zettel unter dem weißen Springer
  { const ti = await kirchberg_mod('metaltable', 'model.gltf', 0); const tx = C.x - 1.6, tz = C.z + .3; if (ti) { ti.scale.set(.3, .72, .3); put(ti, tx, 0, tz, .2); } const ty = ti ? kirchberg_top(ti, tx, tz, 3, .72) : .72;
    for (const [dx, ry] of [[-.62, PI / 2], [.62, -PI / 2]]) { const c = await kirchberg_fbx('chair', NEBEN3_STUHL, .9); if (c) put(c, tx + dx, 0, tz, ry); }
    const brett = kirchberg_tex(kirchberg_cnv(512, 512, (x, w) => { const q = w / 9; x.fillStyle = '#3a2616'; x.fillRect(0, 0, w, w); for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { x.fillStyle = (r + c) % 2 ? '#5a3a20' : '#d8c49a'; x.fillRect(q * .5 + c * q, q * .5 + r * q, q, q); }
      x.font = `${q * .82}px "Segoe UI Symbol", "DejaVu Sans", serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
      const f = [['♜', 0, 0, 0], ['♚', 0, 6, 0], ['♟', 1, 5, 0], ['♟', 1, 6, 0], ['♟', 2, 7, 0], ['♛', 3, 3, 0], ['♔', 7, 6, 1], ['♖', 7, 5, 1], ['♙', 6, 5, 1], ['♙', 6, 6, 1], ['♙', 5, 7, 1], ['♕', 5, 2, 1], ['♘', 4, 4, 1], ['♗', 6, 2, 1]];
      for (const [p, r, c, weiss] of f) { x.fillStyle = weiss ? '#f4efe2' : '#161210'; x.strokeStyle = weiss ? '#3a2a1a' : '#c8b890'; x.lineWidth = 2; x.fillText(p, q * 1 + c * q, q * 1.05 + r * q); x.strokeText(p, q * 1 + c * q, q * 1.05 + r * q); }
      x.fillStyle = '#efe6cc'; x.save(); x.translate(q * 5.1, q * 5.5); x.rotate(.35); x.fillRect(0, 0, q * .9, q * .5); x.restore(); }));
    kirchberg_decal(brett, .42, .42, tx, ty + .004, tz, .2, { rx: -PI / 2, rough: .5, parent: g });
    kirchberg_hit(.5, .3, .5, tx, ty + .1, tz, 'Schachbrett', () => neben3_springer()); PF.tisch = { x: tx, z: tz }; }
  // Talar am Haken, Wandkalender Juni 1992, Foto (Voss mit Rad vor der Kapelle, Gisela mit Eimer)
  { const t = await kirchberg_fbx('w_jacke', { '*': { b: 'model.jpg', rough: .95, ds: true } }, 1.25); if (t) { t.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setRGB(.07, .07, .08); } }); put(t, x0 + .22, .55, C.z + 1.2, PI / 2); }
    kirchberg_hit(.4, 1.4, .7, x0 + .3, 1.2, C.z + 1.2, 'Talar', () => toast('Ein schwarzer Talar am Haken. In der Tasche ein Kuli und ein Hustenbonbon.', 3400));
    const kal = kirchberg_papier({ w: 300, h: 420, bg: '#ece6d4', flecken: 1, zeilen: [['JUNI 1992', 20, 50, 34, '#8a1c1c', 'Georgia, serif', 0], ['Der Ritter im Seelbuch schreibt,', 14, 330, 19, 'rgba(60,60,60,.85)'], ['unter der Erde sieht sie keinen.', 14, 354, 19, 'rgba(60,60,60,.85)'], ['Unser Keller ist trocken …', 14, 378, 19, 'rgba(60,60,60,.85)']],
      fn: (x, w) => { x.strokeStyle = 'rgba(40,40,40,.35)'; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) x.strokeRect(14 + c * 39, 80 + r * 46, 39, 46); x.fillStyle = '#333'; x.font = '15px Georgia'; for (let d = 1; d <= 30; d++) { const k = d + 0, r = Math.floor(k / 7), c = k % 7; x.fillText(String(d), 18 + c * 39, 96 + r * 46); }
        x.strokeStyle = 'rgba(30,40,110,.85)'; x.lineWidth = 3; x.beginPath(); x.ellipse(14 + 1 * 39 + 20, 80 + 3 * 46 + 22, 22, 18, 0, 0, 7); x.stroke(); } });
    kirchberg_decal(kal, .3, .42, x0 + .105, 1.55, C.z - .55, PI / 2, { parent: g });
    kirchberg_hit(.3, .5, .4, x0 + .25, 1.55, C.z - .55, 'Wandkalender', () => openNote('Wandkalender, Juni 1992', 'Der Einundzwanzigste ist mit Kuli umkringelt.\n\n<i>Auf dem Rand, Bleistift:</i> <span class="hand">Der Ritter im Seelbuch schreibt, unter der Erde sieht sie keinen. Unser Keller ist trocken. Ich habe Decken hinuntergetragen und nicht gesagt, wofür.</span>', 'k3_voss_kalender'));
    const foto = kirchberg_papier({ w: 256, h: 200, bg: '#c9b48c', flecken: 1, fn: (x, w, h) => { const gg = x.createLinearGradient(0, 0, 0, h); gg.addColorStop(0, '#b8a07a'); gg.addColorStop(1, '#6a5638'); x.fillStyle = gg; x.fillRect(12, 12, w - 24, h - 40); x.fillStyle = '#4a3a28'; x.fillRect(150, 40, 70, 110); x.beginPath(); x.moveTo(145, 40); x.lineTo(185, 16); x.lineTo(225, 40); x.fill();
      x.fillStyle = '#1a1612'; x.fillRect(70, 70, 16, 60); x.beginPath(); x.arc(78, 62, 9, 0, 7); x.fill(); x.strokeStyle = '#1a1612'; x.lineWidth = 3; x.beginPath(); x.arc(58, 136, 14, 0, 7); x.arc(104, 136, 14, 0, 7); x.stroke(); x.fillStyle = 'rgba(40,30,20,.6)'; x.fillRect(196, 110, 8, 30); x.beginPath(); x.arc(200, 104, 5, 0, 7); x.fill(); } });
    kirchberg_decal(foto, .26, .2, x1 - .105, 1.55, C.z - .1, -PI / 2, { parent: g });
    kirchberg_hit(.3, .4, .4, x1 - .25, 1.55, C.z - .1, 'Foto', () => openNote('Ein Foto', 'Pfarrer Voss mit dem Rad vor der Kapelle, lachend. Im Hintergrund, unscharf, Gisela mit einem Eimer.', 'k3_voss_foto')); }
  // Die Predigtmappe (AP-15) bekommt in Kap. 3 die Mappe mit Reitern
  if (K.predigtHit) { const alt = K.predigtHit.userData.action; K.predigtHit.userData.label = () => kapAb(3) && neben3_k3() ? 'Predigtmappe öffnen' : 'Predigtmappe'; K.predigtHit.userData.action = () => kapAb(3) && neben3_k3() ? neben3_mappe() : alt(); }
  // Brecheisen im Vorbau (zweiter Weg zum Sockel)
  try { const gl = await MSL.gl.loadAsync('assets/ue/brechstange/model.glb'); const b = gl.scene; msFit(b, .8, 'max'); const P = KB_PFARR; b.rotation.set(0, .4, 1.35); b.position.set(P.x + 2.6, .42, P.z + P.d / 2 + .35); b.traverse(m => { if (m.isMesh) m.castShadow = true; }); scene.add(b); PF.eisen = b;
    PF.eisenHit = kirchberg_hit(.9, .6, .5, P.x + 2.6, .4, P.z + P.d / 2 + .35, 'Brecheisen', () => { if (!neben3_k3()) return toast('Ein Brecheisen, an die Wand gelehnt. Rostig.', 2600); b.visible = false; kirchberg_an(PF.eisenHit, false); modItem('n3_brecheisen', 'Brecheisen', 'Aus dem Vorbau des Pfarrhauses. Rostig, schwer.', 'key'); addItem('n3_brecheisen'); neben3_st('predigt').eisen = 1; }); } catch (e) { console.warn('neben3: Brecheisen', e); }
  // die Kerze im Sockel (Scan „candles“), fällt beim Öffnen heraus
  try { const src = await msFBX('candles', 'model.fbx', { Used_candles: { b: 'Used_candles_BaseColor.jpg', n: 'Used_candles_Normal.jpg', r: 'Used_candles_Roughness.jpg' }, Candles_new: { b: 'Candles_new_BaseColor.jpg', n: 'Candles_new_Normal.jpg', r: 'Candles_new_Roughness.jpg' }, Extra_for_candles: { b: 'Extra_for_candles_BaseColor.jpg', n: 'Extra_for_candles_Normal.jpg', r: 'Extra_for_candles_Roughness.jpg', m: 'Extra_for_candles_Metallic.jpg' } });
    src.updateMatrixWorld(true); let m = null; src.traverse(q => { if (q.isMesh && q.name === 'Candle_small_used_low') m = q; });
    if (m) { const geo = m.geometry.clone().applyMatrix4(m.matrixWorld); geo.computeBoundingBox(); const bb = geo.boundingBox; geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2); geo.scale(.009, .009, .009);
      const k = new THREE.Mesh(geo, m.material); k.castShadow = true; k.visible = false; k.userData.noCol = true; scene.add(k); neben3_S.kerze = k;
      neben3_S.kerzeHit = kirchberg_hit(.4, .3, .4, 0, -50, 0, 'Kerze', () => toast('Eine Kerze. Sie ist noch warm.', 2600)); kirchberg_an(neben3_S.kerzeHit, false); } } catch (e) { console.warn('neben3: Kerze', e); }
  return true; }
function neben3_springer() { const st = neben3_st('predigt'); if (neben3_frei()) neben3_start('k3_predigt');
  openNote('Unter dem weißen Springer', '<i>Schach, Weiß am Zug. Unter dem weißen Springer ein gefalteter Zettel:</i>\n\n<span class="hand">Theo, ich bringe sie weg. Halt sie auf, oder halt mich nicht auf. Beides ist eine Antwort. B.</span>', 'k3_springer', () => { st.springer = 1; neben3_predigtDesc(); }); }
function neben3_predigtDesc() { const st = neben3_st('predigt'); if (story.side.k3_predigt && story.side.k3_predigt.state === 'active') neben3_desc('k3_predigt', st.mappe ? (st.hilfe2 ? 'Zwölf Wörter. In welcher Reihenfolge?' : 'Zwölf Predigten, zwölf doppelt unterstrichene Wörter.') : 'Das Studierzimmer. Schach, Weiß am Zug. Die Predigtmappe.'); }
function neben3_mappe() {
  const S = neben3_S, st = neben3_st('predigt'); if (neben3_frei()) neben3_start('k3_predigt'); st.gelesen = st.gelesen || [];
  if (!st.mappe) { st.mappe = 1; st.mappeT = 0; if (Audio.ctx) { const d = Audio.at(KB_RAUM.pfarrhaus.x + 3.8, 1.4, KB_RAUM.pfarrhaus.z - 1.2, 2); [0, .55].forEach((t0, i) => { const o = Audio.osc('square', i ? 1480 : 1760, t0, .05); Audio.env(o, .03, .001, .04, t0, d); }); Audio.creak(.12); } } // die Standuhr schwingt einmal an (Schreck 1)
  const reiter = NEBEN3_MAPPE_LAGE.map((n, k) => `<div class="reiter${st.gelesen.includes(n) ? ' on' : ''}" data-n="${n}" style="--r:${((k * 7) % 5 - 2) * .6}deg">${NEBEN3_PREDIGT[n][0]}</div>`).join('') + `<div class="reiter" data-n="13" style="--r:1deg">—</div>`;
  openPuzzle(`<div class="n3"><h3>Predigtmappe · schwarzes Leder</h3><div class="blatt" style="font-size:17px;margin-bottom:14px"><i style="font-family:Georgia,serif;font-size:13px;color:#6a5a40">Im Deckel, Aufkleber einer Konfirmandenfreizeit. Darunter:</i><br>„Zwölf Predigten, zwölf Striche, derselbe Kuli. Wer das merkt, hat schon die Hälfte.“</div><div class="blaetter">${reiter}</div><div class="blatt" id="n3blatt"><i style="font-family:Georgia,serif;font-size:14px;color:#6a5a40">Rückseiten von Gemeindebriefen. Nur die Zeile um das doppelt unterstrichene Wort ist lesbar.</i></div><div class="knoepfe"></div></div>`, box => {
    box.classList.add('n3box'); const B = box.querySelector('#n3blatt'), kn = box.querySelector('.knoepfe');
    box.querySelectorAll('.reiter').forEach(el => el.onclick = e => { e.stopPropagation(); const n = +el.dataset.n; Audio.paper && Audio.paper(); box.querySelectorAll('.reiter').forEach(r => r.classList.toggle('on', r === el || st.gelesen.includes(+r.dataset.n))); kn.innerHTML = '';
      if (n === 13) { st.dreizehn = 1; B.innerHTML = '<span style="color:#8a8070">— · Das dreizehnte Blatt, fast leer:</span><br>„Wer eine Laterne trägt. – Für die Kinder. Nicht für die Gemeinde. Die Gemeinde weiß es.“';
        if (!story.lore.some(l => l.key === 'k3_dreizehn')) story.lore.push({ key: 'k3_dreizehn', title: 'Wer eine Laterne trägt', html: '<span class="hand">Wer eine Laterne trägt. – Für die Kinder. Nicht für die Gemeinde. Die Gemeinde weiß es.</span>' });
        const b = document.createElement('button'); b.textContent = 'Gegen die Lampe halten'; b.onclick = ev => { ev.stopPropagation(); if (!flashOn) { B.innerHTML += '<br><br><i style="font-family:Georgia,serif;font-size:14px">Ohne Licht siehst du auf der Rückseite nichts.</i>'; return; } st.rueck = 1;
          B.innerHTML = '<span style="color:#8a8070">Rückseite, nur gegen die Lampe lesbar:</span><br>„Wenn du das liest und nicht vom Amt bist: Das Buch liegt dort, wo der Bettler friert. Wenn du vom Amt bist: Er friert seit 1866, ihr habt es nie gemerkt.“'; neben3_predigtDesc(); }; kn.appendChild(b); return; }
      const P = NEBEN3_PREDIGT[n]; B.innerHTML = `<span style="color:#8a8070;font-size:15px">${P[0]}</span><br><span style="filter:blur(1.6px);opacity:.35">… und so sehen wir, dass … Gemeinde … am Ende …</span><br>${P[1]}${P[2] ? `<br><span style="font-size:16px;color:#6a2a1a">Rand: „${P[2]}“</span>` : ''}<br><span style="filter:blur(1.8px);opacity:.3">… Amen … Lied 13 … Kollekte für …</span>`;
      if (!st.gelesen.includes(n)) { st.gelesen.push(n); if (st.gelesen.length === 3 && !st.h1) { st.h1 = 1; setTimeout(() => subtitle('Wieder ein Doppelstrich. Der hat das an einem Abend gemacht.', 3800, 'LUKE'), 200); }
        if (st.gelesen.length === 5 && !st.schnitt) { st.schnitt = 1; setTimeout(() => subtitle('„Zwölf Jahre, ein Kuli. Das ist keine Notiz. Das ist ein Schnitt.“', 4200, 'DU'), 4200); } } }); });
  ui.onClose = () => { neben3_predigtDesc(); if (!story.items.includes('predigtmappe')) { modItem('predigtmappe', 'Predigtmappe', 'Schwarzes Leder, Aufkleber einer Konfirmandenfreizeit. Zwölf Predigten, ein dreizehntes Blatt.', 'paper'); addItem('predigtmappe'); if (kirchberg_S.predigt) kirchberg_S.predigt.visible = false; } }; }
// Martinsnische: Gitter (Kapellenschlüssel) oder Sockelstein (Brecheisen) → warme Kerze fällt heraus (Schreck 2) → Seelbuch, RH-7
function neben3_nischeHuelle() { const nx = KB_KAP.x - 5.2, nz = 80.6, h = neben3_hitSuchen('Martinsnische', nx, nz - .6, 1); if (!h || h.userData.n3) return; h.userData.n3 = true; const alt = h.userData.action;
  const bereit = () => neben3_k3() && neben3_st('predigt').mappe && !neben3_st('predigt').seelbuch;
  h.userData.label = () => bereit() ? (story.items.includes('n3_kapschluessel') ? 'Gitter aufschließen' : story.items.some(k => k === 'n3_brecheisen' || k === 'brechstange') ? 'Sockelstein hebeln' : 'Sockel des Bettlers') : 'Martinsnische';
  h.userData.action = () => { if (!bereit()) return alt(); if (!neben3_frei()) return toast('Nicht jetzt.', 1500); if (story.items.includes('n3_kapschluessel') || story.items.some(k => k === 'n3_brecheisen' || k === 'brechstange')) return neben3_sockel();
    toast('Der Sockel unter dem Bettler klingt hohl. Das Gitter ist zu, und mit bloßen Händen bekommst du den Stein nicht los.', 4200); }; }
async function neben3_sockel() { const st = neben3_st('predigt'); if (st.seelbuch || state.talking) return; state.talking = true; const nx = KB_KAP.x - 5.2, nz = 80.6;
  try { if (story.items.includes('n3_kapschluessel')) { Audio.play('keys1', { gain: .5, x: nx, y: 1, z: nz - .7, ref: 2 }); await wait(700); Audio.creak(.35); } else { Audio.play('metalHit2', { gain: .4, rate: .7, x: nx, y: .4, z: nz - .7, ref: 2 }); await wait(500); Audio.play('stones1', { gain: .5, rate: .8, x: nx, y: .3, z: nz - .7, ref: 2 }); }
    await wait(600);
    // die Kerze fällt zuerst heraus und rollt vor Lukes Füße – sie ist noch warm (Schreck 2)
    const k = neben3_S.kerze; if (k) { k.visible = true; k.position.set(nx + .1, .55, nz - .55); k.rotation.set(0, 0, 0); neben3_S.kerzeFall = { t: 0, vy: 0, vz: -.9, rot: 0 }; }
    Audio.play('woodHit1', { gain: .35, rate: 1.4, x: nx, y: .2, z: nz - 1, ref: 2 }); shake = .02; await wait(1400);
    if (neben3_S.kerzeHit) { neben3_S.kerzeHit.position.set(nx + .1, .15, nz - 1.3); kirchberg_an(neben3_S.kerzeHit, true); } await wait(900);
    await new Promise(r => openNote('Das Seelbuch', '<i>Sechs lose Seiten in Wachstuch, Voss’ Übertragung dabei.</i>\n\n<i>Martini, im Jahr des Herrn 1312.</i> In dieser Nacht fiel ein Licht in den Birkenwald hinter dem Hof des Ritters. Sechs Kinder gingen mit ihren Laternen hinein: die Kinder des Cranz, des Wendel, des Winter, des Reuter, des Brant und des Hofer. Sie kamen an der Hand der Frau Mira wieder heraus, eins nach dem andern.\nDas Kind des Ritters, Luna, sieben Jahre, ist behalten.\nDie Frau Mira ist nicht begraben. Der Ritter hielt sie, bis er schrie. Ihr Rabe ist ihr nachgeflogen und nicht wiedergekommen. Für Mira soll keine Messe gelesen werden. Sie kommt noch.\n\n<i>Im Winter 1313.</i> Der Schmied hat dem Ritter einen Harnisch gemacht aus dem, was die drei Kleinen im Schnee brachten, und seither kein Wort mehr gesagt.\n\n<i>Anno 1329, andere Hand.</i> Es ging wieder auf. Der Ritter ging hinein und rief nach dem Kind, im Harnisch aus dem, was die drei Kleinen brachten, und ward nicht gesehen.\n\n<i>(Voss, Bleistift:)</i> <span class="hand">Die sechs Namen sind unsere sechs Familien. Das Fest ist die Nacht. Ich habe zweiundzwanzig Mal darüber gepredigt und es nicht gewusst.</span>', 'k3_seelbuch', r));
    st.seelbuch = 1; await say([['„Na super. Wir sind Gründungsmitglied.“', 3200, 'DU']]); neben3_rh('RH-7');
    neben3_fertig('k3_predigt', 'Das Seelbuch. Das Laternenfest feiert die Nacht von 1312. Ganz vorn steht Luna.'); neben3_merk('predigt'); }
  finally { state.talking = false; } }

// =====================================================================  4 · „Dürfen Ritter weinen?“ – Nr. 4, Peters Zimmer (Raum aus nr4.js, AP-15)
async function neben3_peterBau() {
  const S = neben3_S; if (S.peter || typeof nr4_S === 'undefined' || !nr4_S.R) return !!S.peter; const R = nr4_S.R, g = R.g, C = NR4, T = THREE, PZ = S.peter = { R }, put = (o, x, y, z, ry) => kirchberg_setze(o, x, y, z, ry, g);
  // Tür (Scan) an ein Scharnier hängen, damit sie aufschwingt; Kollisionskasten merken
  let tuer = null; for (const o of g.children) if (Math.abs(o.position.x - (C.x + 3)) < .05 && Math.abs(o.position.z - (C.z + .02)) < .05 && !o.isMesh) tuer = o;
  if (tuer) { const piv = new T.Group(); piv.position.set(C.x + 3 - .52, 0, C.z + .02); g.add(piv); g.remove(tuer); tuer.position.set(.52, 0, 0); piv.add(tuer); PZ.piv = piv; PZ.auf = 0; PZ.aufZiel = 0; }
  PZ.col = colliders.find(c => Math.abs(c.minX - (C.x + 3 - .55)) < .03 && Math.abs(c.maxZ - (C.z + .04)) < .03) || null;
  // Omas Zettel an der Zimmertür (Tesa, vergilbt), auf der Flurseite
  kirchberg_decal(kirchberg_papier({ w: 256, h: 200, bg: '#e9dfbf', tesa: true, flecken: 2, zeilen: [['Nicht aufmachen.', 16, 58, 30], ['Nicht weil da was drin ist.', 16, 104, 24], ['Weil da keiner mehr drin ist.', 16, 138, 24], ['– E.', 16, 182, 26]] }), .15, .12, C.x + 2.72, 1.62, C.z + .07, 0, { parent: g });
  if (nr4_S.peterHit) { const alt = nr4_S.peterHit.userData.action; nr4_S.peterHit.userData.label = () => kapAb(3) ? (neben3_st('ritter').offen ? '' : 'Peters Zimmer') : 'Durchs Schlüsselloch sehen'; nr4_S.peterHit.userData.action = () => kapAb(3) ? neben3_peterTuer() : alt(); }
  // Schreibtisch an der Wand, Stuhl davor – zum Fenster gedreht (S-13); Kassettenrekorder (Röhrenradio-Scan als Rückfall) mit Zettel
  { const ti = await kirchberg_mod('metaltable', 'model.gltf', 0); if (ti) { ti.scale.set(.28, .76, .55); put(ti, C.x + .42, 0, C.z - 3.3, PI / 2); } const ty = ti ? kirchberg_top(ti, C.x + .42, C.z - 3.3, 3, .76) : .76; PZ.ty = ty;
    if (nr4_S.peterStuhl) { nr4_S.peterStuhl.position.set(C.x + 1.05, 0, C.z - 3.35); nr4_S.peterStuhl.rotation.y = PI + .05; PZ.stuhl = nr4_S.peterStuhl; }
    const rk = await kirchberg_mod('radio', 'model.gltf', .3, 'max'); if (rk) { rk.traverse(m => { if (m.name === 'tubes') m.visible = false; if (m.isMesh) { m.material = m.material.clone(); m.material.color.multiplyScalar(.55); } }); put(rk, C.x + .35, ty, C.z - 3.55, PI / 2 + .1); }
    kirchberg_decal(kirchberg_papier({ w: 256, h: 120, bg: '#ece2c4', tesa: true, flecken: 1, zeilen: [['Leise, Peter. Sonst denken die', 10, 44, 20, 'rgba(30,30,80,.85)'], ['Nachbarn, wir hätten Spaß. – Mama', 10, 84, 20, 'rgba(30,30,80,.85)']] }), .14, .065, C.x + .36, ty + .02, C.z - 3.3, 0, { rx: -PI / 2, rz: .3, parent: g });
    kirchberg_hit(.5, .35, .6, C.x + .4, ty + .12, C.z - 3.45, () => neben3_st('ritter').sb05 ? 'Kassette abspielen' : 'Kassettenrekorder', () => neben3_rekorder());
    await kirchberg_kram(g, [['stapel', C.x + .45, ty, C.z - 2.85], ['glas', C.x + .5, ty, C.z - 3.95], ['zeitung', C.x + .45, ty, C.z - 3.05, 1.6, .5]]); }
  // Wimpel vom Schützenfest, Zigarrenkiste unter dem Bett, E-21 auf dem Kopfkissen, altes Spielzeug
  kirchberg_decal(kirchberg_tex(kirchberg_cnv(256, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#7a1a1a'; x.beginPath(); x.moveTo(0, 0); x.lineTo(w, h / 2); x.lineTo(0, h); x.fill(); x.fillStyle = '#e8d8a0'; x.font = '22px Georgia'; x.fillText('Schützenfest', 14, h / 2 + 2); x.font = '16px Georgia'; x.fillText('Lost Eyengless', 14, h / 2 + 22); })), .5, .25, C.x + 5.88, 1.7, C.z - 1.6, -PI / 2, { alpha: true, parent: g });
  { const kiste = kirchberg_tex(kirchberg_cnv(256, 160, (x, w, h) => { x.fillStyle = '#5a3218'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2a160a'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6); x.fillStyle = '#d8b060'; x.fillRect(40, 40, w - 80, 60); x.fillStyle = '#3a1a0a'; x.font = '20px Georgia'; x.fillText('HAVANNA', 70, 70); x.font = '24px "Caveat", cursive'; x.fillStyle = '#f0e6c8'; x.fillText('Peters Schätze', 60, 134); }));
    kirchberg_decal(kiste, .3, .19, C.x + 4.35, .012, C.z - 2.95, .25, { rx: -PI / 2, parent: g }); kirchberg_hit(.5, .3, .4, C.x + 4.35, .15, C.z - 2.95, 'Zigarrenkiste unter dem Bett', () => neben3_zigarrenkiste()); }
  kirchberg_decal(kirchberg_papier({ w: 200, h: 140, bg: '#f0e8d0', flecken: 0, zeilen: [['Für Luke, falls er’s', 10, 40, 20], ['mal erfährt: …', 10, 72, 20]] }), .13, .09, C.x + 5.3, .62, C.z - 3.55, 0, { rx: -PI / 2, rz: .2, parent: g });
  kirchberg_hit(.4, .3, .4, C.x + 5.3, .68, C.z - 3.55, 'Zettel auf dem Kopfkissen', () => openNote('Auf dem Kopfkissen', '<span class="hand">Für Luke, falls er’s mal erfährt: Ich hab’s am ersten Morgen gesehen. Du bist mein Enkel. Punkt. Mehr gibt’s dazu nicht zu sagen. Und jetzt iss was.</span>', 'nr4_E21'));
  { const sp = await kirchberg_mod('toys_old', 'model.gltf', .45).catch(() => null); if (sp) put(sp, C.x + 3.2, 0, C.z - 4.55, .5); }
  PZ.tuerP = new T.Vector3(C.x + 3, 1.4, C.z); return true; }
async function neben3_peterTuer() { const st = neben3_st('ritter'), PZ = neben3_S.peter; if (!PZ || st.offen || state.talking) return;
  if (!neben3_frei()) return toast('Offen. Ein Kopfkissen, darauf ein Zettel.', 2400);
  openNote('Zettel an der Zimmertür', '<i>Tesa, vergilbt.</i>\n\n<span class="hand">Nicht aufmachen.\nNicht weil da was drin ist. Weil da keiner mehr drin ist.\n– E.</span>', 'k3_oma_tuer', () => { st.offen = 1; neben3_start('k3_ritter', { x: NR4.haus.x, z: NR4.haus.z - 6 }); neben3_peterOffen(); Audio.play('doorCreak', { gain: .45, x: NR4.x + 3, y: 1.2, z: NR4.z, ref: 2 }); }); }
function neben3_peterOffen() { const PZ = neben3_S.peter; if (!PZ) return; PZ.aufZiel = 1; if (PZ.col) { PZ.col.top = -60; PZ.col.base = -61; } if (nr4_S.peterHit) kirchberg_an(nr4_S.peterHit, false); }
function neben3_zigarrenkiste() { const st = neben3_st('ritter'); if (!neben3_frei() && !st.sb05) return toast('Eine Zigarrenkiste. „Peters Schätze“.', 2200);
  if (st.sb05) return typeof sammeln_sb === 'function' ? sammeln_sb(5) : null;
  openNote('Zigarrenkiste „Peters Schätze“', 'Murmeln, ein Wimpel vom Schützenfest, und eine lose, wasserfleckige Seite mit Holzsplitter.\n\n<i>Obenauf Omas Zettel:</i> <span class="hand">Lag nach der Nacht unter Peters Bett. Ist nicht von uns. Weggeschmissen hab ich’s trotzdem nicht. – E.</span>', 'k3_peters_schaetze', () => {
    if (typeof sammeln_sb === 'function') { ui.pendingClose2 = () => neben3_sb05(); sammeln_sb(5); } else neben3_sb05(); }); }
async function neben3_sb05() { const st = neben3_st('ritter'); if (st.sb05) return; st.sb05 = 1; neben3_desc('k3_ritter', 'Im Rekorder steckt eine Kassette: „MARION · FÜR K-1“.');
  await wait(400); await say([['Braune Augen. Peter hatte sie. Ich hab sie. Wessen Augen sind das?', 4600, 'LUKE']]);
  if (!story.lore.some(l => l.key === 'k3_peter_augen')) story.lore.push({ key: 'k3_peter_augen', title: 'Dürfen Ritter weinen?', html: '<span class="hand">Onkel Peter und ich. Dieselben Augen. Dieselbe Hand?</span>' });
  const PZ = neben3_S.peter; if (PZ && PZ.stuhl) { PZ.stuhl.rotation.y = -PI / 2 + .15; st.stuhlT = 0; st.stuhl = 1; } }
async function neben3_rekorder() { const st = neben3_st('ritter'); if (state.talking) return;
  if (!st.zettel) { st.zettel = 1; openNote('Zettel auf dem Rekorder', '<i>Ältere Schrift:</i>\n\n<span class="hand">Leise, Peter. Sonst denken die Nachbarn, wir hätten Spaß. – Mama</span>', 'k3_rekorder_zettel', () => say([['„Oma. Auf Sendung, auch mit Zettel.“', 3000, 'DU']])); return; }
  if (!st.sb05) return toast('Im Rekorder steckt eine Kassette. Etikett: „MARION · FÜR K-1“, „K-1“ durchgestrichen, darüber in Omas Schrift „PETER“.', 4800);
  state.talking = true; let rausch = null;
  try { Audio.play('switch1', { gain: .4, x: NR4.x + .35, y: .8, z: NR4.z - 3.55, ref: 2 }); await wait(600); rausch = Audio.play('static', { loop: true, gain: .07, lp: 2200, x: NR4.x + .35, y: .8, z: NR4.z - 3.55, ref: 2 }); await wait(1100);
    await say([['„Peter. Ich bin’s. Die zwei wollen dir Hallo sagen.“', 3800, 'MARION'], ['„Hallo Onkel Peter! Luke, jetzt du! Laut!“', 3400, 'LUCY'], ['„… Hallo.“', 2200, 'JUNGE']]);
    await wait(900); if (rausch) rausch.stop(.3); rausch = null; await wait(1600); await say([['„Das ist nicht meine Stimme.“', 3000, 'DU']]);
    if (!story.items.includes('n3_kassette_peter')) { modItem('n3_kassette_peter', 'Kassette „Peter“', 'Etikett „MARION · FÜR K-1“, „K-1“ mit Kuli durchgestrichen, darüber in Omas Schrift „PETER“.', 'paper'); addItem('n3_kassette_peter'); }
    neben3_fertig('k3_ritter', 'Mama hat mit neun einen Ritter getröstet. Onkel Peter und ich: dieselben Augen.'); }
  finally { if (rausch) rausch.stop(.2); state.talking = false; } }
function neben3_peterTick(dt) { const PZ = neben3_S.peter; if (!PZ) return; if (PZ.piv) { PZ.auf += (PZ.aufZiel - PZ.auf) * Math.min(1, dt * 1.8); PZ.piv.rotation.y = -PZ.auf * 1.45; }
  const st = neben3_st('ritter'); if (st.stuhl !== 1 || !PZ.stuhl || kirchberg_S.inRaum !== 'nr4') return; // Stuhl dreht sich wieder zum Fenster, während Luke zur Tür sieht (Schreck 1)
  if (neben3_blick(PZ.tuerP.x, PZ.tuerP.y, PZ.tuerP.z, .75) && !neben3_blick(PZ.stuhl.position.x, .6, PZ.stuhl.position.z, .45)) st.stuhlT = (st.stuhlT || 0) + dt; else st.stuhlT = 0;
  if (st.stuhlT > .9) { st.stuhl = 2; PZ.stuhl.rotation.y = PI + .05; Audio.play('woodSqueak2', { gain: .12, rate: 1.3, x: PZ.stuhl.position.x, y: .5, z: PZ.stuhl.position.z, ref: 1.5 });
    setTimeout(() => { for (let i = 0; i < 3; i++) setTimeout(() => Audio.stepAt && Audio.stepAt(NR4.x + 2.4 + i * .6, NR4.z - 6.2, .35), 900 + i * 420); }, 1200); } }

// =====================================================================  18 · „Siebzehn Näpfe“ (Fortsetzung, N-02) – vier Katzen zeigen die Spuren des Beobachters, dann Giselas Küche
const NEBEN3_KATZEN = { GRETE: { at: [-58.5, 79.75], starrt: [-57.7, .55, 80.6], spur: ['kiesel', { pos: [-57.62, .6, 80.3] }] },
  KEINER: { at: [-59.45, 50.45], starrt: [-60, 1.25, 49.6], spur: ['beschlag', { pos: [-60.1, 1.28, 49.58], ry: 0 }] },
  ZAYN: { karussell: true, starrt: null },
  ANNI: { at: [-54.4, 66.9], sims: true, starrt: [-54.9, .5, 66.8], spur: ['kratzer', { pos: [-54.95, .48, 66.72], ry: 0, w: .1, h: .13 }] } };
const NEBEN3_HECKE = [-56.8, .9, 64.6];
function neben3_naepfeTick(dt) {
  const S = neben3_S, st = neben3_st('naepfe'), q = story.side.kb_naepfe; if (!q || typeof katzen_get !== 'function' || !neben3_frei()) return; st.sp = st.sp || {};
  const P = player.pos;
  if (!st.los) { if (Math.hypot(P.x - 23.3, P.z - 52.2) > 7) return; st.los = 1; if (q.state !== 'active') { q.state = 'active'; questPop('NEBENAUFGABE', q.title + ' (Fortsetzung)'); } neben3_desc('kb_naepfe', 'Vier Katzen laufen hinter etwas her, das man nicht sieht. Anni, Zayn, Grete, Keiner. (0/4)');
    say([['„Vier Katzen laufen hinter nichts her. Das ist entweder ein Wunder oder ein Katzending.“', 4600, 'DU']]);
    ['GRETE', 'KEINER', 'ZAYN', 'ANNI'].forEach((n, i) => { const k = katzen_get(n); if (!k) return; k.streunen = false; setTimeout(() => katzen_goto(k, 10 - i * .8, 57.2 + i * .15, { lauf: true, frei: true }), 300 + i * 260); S.unterwegs = S.unterwegs || {}; S.unterwegs[n] = 1; }); return; }
  for (const n in NEBEN3_KATZEN) { const k = katzen_get(n), D = NEBEN3_KATZEN[n]; if (!k) continue;
    if (S.unterwegs && S.unterwegs[n] && Math.hypot(P.x - k.x, P.z - k.z) > 22) { S.unterwegs[n] = 0; // außer Sicht: an ihrer Spur
      if (D.karussell) { k.stare = null; S.zayn = k; } else { katzen_place(k, D.at[0], D.at[1], { ry: Math.atan2(D.starrt[0] - D.at[0], D.starrt[2] - D.at[1]), pose: 'sit', sims: D.sims }); katzen_stare(k, D.starrt); }
      if (D.spur && typeof beob_spur === 'function') try { beob_spur(D.spur[0], D.spur[1]); } catch (e) {} }
    if (S.unterwegs && S.unterwegs[n] === 0 && !st.sp[n] && Math.hypot(P.x - k.x, P.z - k.z) < 4.6 && neben3_blick(k.x, k.y + .2, k.z, .75)) { st.sp[n] = 1;
      const m = Object.keys(st.sp).length; neben3_desc('kb_naepfe', m < 4 ? `Die Katzen sitzen an Spuren. (${m}/4)` : 'Zurück zu Gisela, Am Kirchberg 3. Die Tür steht offen.');
      if (n === 'ANNI') { Audio.play('woodCrack', { gain: .12, rate: 1.8, lp: 1400, x: NEBEN3_HECKE[0], y: 1, z: NEBEN3_HECKE[2], ref: 2 }); for (const nn in NEBEN3_KATZEN) { const kk = katzen_get(nn); if (kk && kk.on) katzen_stare(kk, NEBEN3_HECKE); } } } }
  // Zayn fährt auf dem Karussell, das sich ganz langsam dreht, ohne Wind
  const Z = S.zayn; if (Z && typeof ausbau_nord !== 'undefined' && ausbau_nord.merry) { const M = ausbau_nord.merry; M.w = Math.max(M.w, .22); const a = M.piv.rotation.y; Z.x = 34 + Math.cos(a) * .72; Z.z = 71.2 - Math.sin(a) * .72; Z.ry = -a; Z.y = Z.gy = .42; Z.perch = .42; Z.g.position.set(Z.x, .42, Z.z); Z.g.rotation.y = Z.ry; } }
// Giselas Küche: Gisela schläft am Tisch (Mantel, eine Katze auf dem Rücken); nach den vier Spuren die siebzehn Köpfe, dann ist sie so lange wach, wie die Katzen auf ihr sitzen
async function neben3_giselaFigur() { const S = neben3_S; if (S.gis || S.gisLaed || typeof kirchberg_figur !== 'function') return; S.gisLaed = true;
  const F = await kirchberg_figur('gisela_k3', { id: 'gisela', speed: .7, stride: .92, hunch: .06 }); if (!F) return; S.gis = F; const C = KB_RAUM.gisela;
  F.g.position.set(C.x - 1.38, 0, C.z - .15); F.g.rotation.y = -PI / 2 + .2; lwo_clip(F, F.acts.sit2 ? 'sit2' : F.acts.sit ? 'sit' : 'idle'); lwo_blick(F, null); F.g.visible = kirchberg_S.inRaum === 'gisela'; }
function neben3_katzeAuf(k, x, y, z, ry, pose = 'loaf') { if (!k) return; k.stare = null; katzen_place(k, x, z, { y, ry, pose }); }
async function neben3_kueche() {
  const S = neben3_S, st = neben3_st('naepfe'), F = S.gis, C = KB_RAUM.gisela, R = kirchberg_S.raeume.gisela; if (st.kueche || !F || !R || state.talking) return; st.kueche = 1;
  const alle = ['ANNI', 'ZAYN', 'GRETE', 'KEINER', 'LUNA', 'PETER', 'LISBETH', 'FRITZ', 'MARIE', 'JAKOB', 'KATHRIN', 'VEIT', 'BÄRBEL', 'ROXY', 'MIKE', 'LUCY'].map(n => katzen_get(n)).filter(Boolean);
  const tuer = [C.x - 2.5, .9, R.z1], ecke = [R.x0 + .2, .5, R.z1 - .35];
  const plaetze = [[C.x - 3.6, .0, C.z - 2.9], [C.x - 3.1, 0, C.z - 1.6], [C.x - 3.9, 0, C.z + .4], [C.x - 1.1, 0, C.z + 1.3], [C.x - .7, 0, C.z - 2.6], [C.x - 2.6, .78, C.z - .45], [C.x - 1.85, .78, C.z + .05], [C.x - 3.15, .45, C.z - .2], [C.x - 2.2, .45, C.z + .6], [C.x - 4.1, 1.52, C.z + 2.3],
    [C.x - .45, 0, C.z + .2], [C.x - 3.4, 0, C.z + 2.1], [C.x - 1.4, 0, C.z - 1.9], [C.x - 4.0, .88, C.z + 1.6], [C.x - .9, 0, C.z - 1.0], [C.x - 2.9, 0, C.z - 3.0]];
  alle.forEach((k, i) => { const p = plaetze[i % plaetze.length]; k.streunen = false; k.heim = { x: p[0], z: p[2], r: .3 }; katzen_place(k, p[0], p[2], { y: p[1], ry: Math.atan2(tuer[0] - p[0], tuer[2] - p[2]), pose: i % 3 ? 'sit' : 'loaf' }); katzen_stare(k, tuer); });
  S.kuecheKatzen = alle; S.dreh = { phase: 0, t: 0, tuer, ecke }; // Umdrehen: nichts. Zurückdrehen: alle Köpfe sind ihm gefolgt, jetzt in die Ecke neben dem Kühlschrank
}
function neben3_kuecheTick(dt) { const S = neben3_S, D = S.dreh; if (!D || D.phase >= 2 || kirchberg_S.inRaum !== 'gisela') return;
  if (D.phase === 0) { if (neben3_blick(D.tuer[0], D.tuer[1], D.tuer[2], .7)) D.t += dt; else D.t = 0; if (D.t > .5) { D.phase = 1; D.t = 0; } }
  else if (D.phase === 1 && !neben3_blick(D.tuer[0], D.tuer[1], D.tuer[2], .2)) { D.phase = 2; for (const k of S.kuecheKatzen) katzen_stare(k, D.ecke); if (typeof spannung_mark === 'function') try { spannung_mark('welt2'); } catch (e) {}
    setTimeout(() => neben3_giselaWach(), 2600); } }
async function neben3_giselaWach() {
  const S = neben3_S, st = neben3_st('naepfe'), F = S.gis, C = KB_RAUM.gisela; if (st.wach || !F) return; st.wach = 1; state.talking = true; const G = 'GISELA', sag = z => kirchberg_sag(F, z.map(l => [l[0], l[1], l[2] === undefined ? G : l[2]]));
  try { // die Katzen klettern auf Gisela, eine nach der anderen
    const K = S.kuecheKatzen, fx = F.g.position.x, fz = F.g.position.z, auf = [[fx + .05, .66, fz + .12, 'loaf'], [fx - .02, 1.3, fz - .18, 'sit'], [fx + .1, 1.34, fz + .2, 'loaf'], [fx - .25, .98, fz - .02, 'loaf'], [fx - .5, .8, fz + .25, 'sit']];
    for (let i = 0; i < K.length; i++) { const k = K[i]; if (i < auf.length) { const a = auf[i]; neben3_katzeAuf(k, a[0], a[1], a[2], rand(0, 6), a[3]); } else katzen_goto(k, fx - .6 + Math.cos(i) * .8, fz + Math.sin(i) * .8, { frei: true }); katzen_schnurren(k, i < 3); await wait(260); }
    await wait(900); lwo_clip(F, F.acts.sit_talk ? 'sit_talk' : F.acts.sit ? 'sit' : 'idle'); lwo_blick(F, 'luke'); await wait(1200);
    await sag([['„Setz dich. Der da in der Ecke ist dein Freund, glaub ich. Die Katzen fauchen nicht. Die gucken bloß.“', 5200]]);
    await sag([['„Vorhin stand einer an der Bushaltestelle. Grauer Mantel, Handschuhe, Thermoskanne. Der saß an diesem Tisch, als Hänschen weg war. Der hat sich nicht verändert. Das ist nicht gesund.“', 8200]]);
    // zwischen den Happen: eine Katze auf der Herdplatte
    const hk = katzen_get('FRITZ'), hx = kirchberg_S.raeume.gisela.x0 + .38, hz = kirchberg_S.raeume.gisela.z1 - 1.9;
    if (hk) { katzen_place(hk, hx, hz, { y: .89, ry: 1.2, pose: 'sit' }); state.talking = false; await new Promise(r => { katzen_klick(hk, 'Katze von der Herdplatte heben', () => { katzen_klick(hk, null); katzen_tragen(hk); setTimeout(() => { katzen_absetzen(hk, hx + 1.1, hz - .6); r(); }, 1300); }); }); state.talking = true; await wait(500); }
    await sag([['„Sie kennen ihn?“', 1800, 'DU'], ['„Ich kenn seine Handschuhe. Die hat er beim Kaffee nicht ausgezogen. Meine Mutter fand das unhöflich. Und dann hat sie unterschrieben.“', 7000]]);
    state.talking = false; const a = await kirchberg_wahl(['„Hänschen?“', '„Und Luna?“']); state.talking = true;
    const haens = async () => { await sag([['„Er war doch nur kurz Laterne laufen. Dann brachten die einen zurück, der sah aus wie er. Ich hab gesagt: Mama, das ist nicht der Hans.“', 7200]]); neben3_hoergeraet(); await wait(900);
      await sag([['„Er hatte graue Augen. Hänschen hatte braune.“', 3600]]); await wait(1200); subtitle('Sie schiebt dir den Blechteller mit dem Brot hin und zieht ihn wieder weg.', 3600); await wait(3200); await sag([['„Nicht das. Das ist seins.“', 2600]]);
      if (!story.lore.some(l => l.key === 'k3_nicht_hans')) story.lore.push({ key: 'k3_nicht_hans', title: 'Das ist nicht der Hans', html: '„Er war doch nur kurz Laterne laufen. Dann brachten die einen zurück, der sah aus wie er. Ich hab gesagt: Mama, das ist nicht der Hans.“\n„Er hatte graue Augen. Hänschen hatte braune.“' }); };
    const luna = async () => { await sag([['„Der älteste Name. Der Pfarrer hat gesagt, das Kind steht ganz vorn im Buch.“', 4400]]); await wait(400); await say([['Luna. Nicht Lucy.', 2400, 'LUKE']]); };
    if (a === 0) { await haens(); await sag([['„Ich hab Marion getroffen, damals, mit dir an der Hand. Ich hab dir ins Gesicht geguckt. Und dann hab ich nach dem Wetter gefragt.“', 7000]]); await luna(); }
    else { await luna(); await haens(); await sag([['„Ich hab Marion getroffen, damals, mit dir an der Hand. Ich hab dir ins Gesicht geguckt. Und dann hab ich nach dem Wetter gefragt.“', 7000]]); }
    await sag([['„Hier. Pfarrhaus. Den von der Kapelle hat der Lars. Frag mich nicht, wieso. Doch, frag: Weil er ihn geklaut hat.“', 6400]]);
    modItem('n3_pfarrschluessel', 'Pfarrhausschlüssel', 'Messing, Korkanhänger: „PFARRHAUS – NICHT DER KAPELLE“.', 'key'); addItem('n3_pfarrschluessel'); if (typeof kirchberg_oeffne === 'function') kirchberg_oeffne('pfarrhaus'); st.schluessel = 1;
    neben3_desc('kb_naepfe', 'Pfarrhausschlüssel. „Das ist nicht der Hans.“ Gisela schläft wieder.');
    // die Katzen springen ab, eine nach der anderen; Gisela schläft mitten im Satz wieder ein
    for (let i = 0; i < Math.min(5, K.length); i++) { const k = K[i]; katzen_schnurren(k, false); katzen_place(k, fx - .9 + i * .35, fz + (i % 2 ? .7 : -.6), { ry: rand(0, 6), pose: 'stand' }); Audio.play('woodHit3', { gain: .08, rate: 1.6, x: fx, y: .3, z: fz, ref: 1.5 }); await wait(420); }
    lwo_clip(F, F.acts.sit2 ? 'sit2' : 'sit'); lwo_blick(F, null); neben3_save(); }
  finally { state.talking = false; } }
function neben3_hoergeraet() { if (!Audio.ctx || !neben3_S.gis) return; const g = neben3_S.gis.g.position, d = Audio.at(g.x, 1.4, g.z, 1.2); const o = Audio.osc('sine', 3150, 0, 1.4); o.frequency.linearRampToValueAtTime(3380, Audio.ctx.currentTime + 1.2); Audio.env(o, .025, .15, 1.1, 0, d); }

// =====================================================================  Laden, Takt
function neben3_radHuelle() { const P = KB_PFARR, h = neben3_hitSuchen('Herrenrad', P.x - 1.2, P.z + P.d / 2 + .55, 1.2); if (!h || h.userData.n3) return; h.userData.n3 = true; const alt = h.userData.action;
  h.userData.action = () => { alt(); const st = neben3_st('predigt'); if (neben3_k3() && !st.rad) { st.rad = 1; ui.onClose2 = () => say([['„Wer pumpt einem Toten die Reifen?“', 2800, 'DU']]); } }; }
function neben3_nachLaden() { const S = neben3_S;
  if (neben3_st('ritter').offen) neben3_peterOffen();
  if (story.items.includes('predigtmappe') && kirchberg_S.predigt) kirchberg_S.predigt.visible = false;
  if (neben3_st('predigt').eisen && S.pfarr && S.pfarr.eisen) { S.pfarr.eisen.visible = false; kirchberg_an(S.pfarr.eisenHit, false); }
  if (neben3_st('kapelle').seil1 && S.kap) kirchberg_an(S.kap.zettelHit, true);
  const n = neben3_st('naepfe'); if (n.los) { S.unterwegs = { GRETE: 1, KEINER: 1, ZAYN: 1, ANNI: 1 }; if (!n.schluessel) { n.kueche = 0; n.wach = 0; } }
  if (ch3.lampsOff && neben3_k3()) neben3_schliessen(); }
WORLD_MODS.push(['Kap. 3 · Nebenaufgaben (AP-18)', async () => {
  const S = neben3_S; neben3_register(); neben3_jagdHuelle();
  if (typeof KAPITEL3_LATERNE4 !== 'undefined') KAPITEL3_LATERNE4.push(() => neben3_schliessen());
  if (typeof KAPITEL3_EISEN !== 'undefined') KAPITEL3_EISEN.push([-54.4, 66.9, 1.6], [KB_KAP.x - 5.2, 79.9, 1.4]); // Friedhofstor, Gitter der Martinsnische
  for (const [n, f] of [['Kapelle', neben3_kapelleBau], ['Pfarrhaus', neben3_pfarrBau], ['Peters Zimmer', neben3_peterBau]]) { try { await f(); } catch (e) { console.warn('neben3: ' + n, e); } }
  neben3_nischeHuelle(); neben3_radHuelle(); neben3_minimalBau(); S.ready = true;
  window.__neben3 = { S, st: neben3_st, frei: neben3_frei, register: neben3_register, schliessen: neben3_schliessen, fenster: () => neben3_fensterBlick(), fuehrer: () => neben3_fuehrer(), suehne: () => neben3_suehne(), buch: () => neben3_gesangbuch(),
    seil: () => neben3_seil(), joker: () => neben3_joker(), fang: () => neben3_glockeFang(), mappe: () => neben3_mappe(), springer: () => neben3_springer(), sockel: () => neben3_sockel(), peterTuer: () => neben3_peterTuer(), kiste: () => neben3_zigarrenkiste(),
    rekorder: () => neben3_rekorder(), kueche: () => neben3_kueche(), wach: () => neben3_giselaWach(), gisela: () => neben3_giselaFigur(), uk: n => { if (typeof kapitel3_S !== 'undefined') kapitel3_S.uk = n; }, orte: NEBEN3_ORTE, bus: () => neben3_bus(), band: () => neben3_band(), dina: () => neben3_dina(), gully: () => neben3_gully() }; // Testzugriff
}]);
WORLD_TICK.push((dt, t) => {
  const S = neben3_S; if (!S.ready) return; S.t += dt; if (S.frostT > 0) S.frostT -= dt;
  if (S.nachLaden && state.started) { S.nachLaden = false; neben3_nachLaden(); }
  if (!S.zu && ch3.lampsOff && neben3_k3()) neben3_schliessen();
  neben3_kapTick(dt, t); neben3_peterTick(dt);
  neben3_minimalTick(dt);
  // warme Kerze aus dem Sockel: fällt, springt einmal, rollt aus (Schwerkraft, Reibung)
  const KF = S.kerzeFall, k = S.kerze; if (KF && k) { KF.t += dt; KF.vy -= 9.8 * dt; k.position.y += KF.vy * dt; k.position.z += KF.vz * dt; if (k.position.y < .03) { k.position.y = .03; KF.vy = Math.abs(KF.vy) > 1 ? -KF.vy * .25 : 0; KF.vz *= .55; }
    KF.rot = Math.min(PI / 2, KF.rot + dt * 5); k.rotation.x = -KF.rot; if (KF.t > 2.5 || (Math.abs(KF.vz) < .02 && KF.vy === 0)) S.kerzeFall = null; }
  if (!neben3_k3() || !ch3.on) { if (S.gis && S.gis.g.visible) S.gis.g.visible = false; return; }
  neben3_fuesse(dt); neben3_naepfeTick(dt); neben3_kuecheTick(dt);
  // Predigt: Hilfeleiter (2) nach einer Minute, (4) Beobachter-Zettel B-K3-N1 im Flur des Pfarrhauses nach zwei Minuten
  const pr = neben3_st('predigt'); if (pr.mappe && !pr.seelbuch && neben3_frei()) { pr.mappeT = (pr.mappeT || 0) + dt;
    if (pr.mappeT > 60 && !pr.hilfe2) { pr.hilfe2 = 1; neben3_predigtDesc(); }
    if (pr.mappeT > 120 && !pr.n1 && kirchberg_S.inRaum === 'pfarrhaus' && typeof beobachter_zettel === 'function' && !state.talking) { const C = KB_RAUM.pfarrhaus; if (beobachter_zettel('B-K3-N1', { pos: [C.x - 2.8, .02, C.z + 1.6] })) pr.n1 = 1; } }
  // Gisela: am Küchentisch (ab Kap. 3); die Küchenszene nach den vier Spuren
  if (!S.gis && !S.gisLaed && (kirchberg_S.inRaum === 'gisela' || Math.hypot(player.pos.x - KB_HAUS.x, player.pos.z - KB_HAUS.z) < 30)) neben3_giselaFigur();
  if (S.gis) { const v = kirchberg_S.inRaum === 'gisela'; if (S.gis.g.visible !== v) S.gis.g.visible = v; }
  const np = neben3_st('naepfe'); if (S.gis && kirchberg_S.inRaum === 'gisela' && !np.kueche && np.sp && Object.keys(np.sp).length >= 4 && neben3_frei() && !state.talking) neben3_kueche();
});

// =====================================================================  Schlanke Fassungen (Zwischenversion): Aufgaben 5–17, 20 und „Außenstelle 3“ – spielbar, Wortlaute der Bibel,
// Orte als Klickflächen an den vorhandenen Stellen; Ausbau (eigene Räume, Figuren, Remise, Bus) später in den Ortsmodulen.
const NEBEN3_ORTE = [];
function neben3_ort(x, y, z, w, h, d, label, fn, wann) { const m = kirchberg_hit(w, h, d, x, y, z, label, fn); kirchberg_an(m, false); const O = { m, wann, an: false }; NEBEN3_ORTE.push(O); return O; }
function neben3_orteTick() { for (const O of NEBEN3_ORTE) { let a = false; try { a = !!O.wann(); } catch (e) {} if (a !== O.an) { O.an = a; kirchberg_an(O.m, a); } } }
const neben3_q = k => story.side[k] && story.side[k].state;
const neben3_auf = k => neben3_offen(k); // Aufgabe noch offen und Fenster offen
function neben3_note(title, html, key) { return new Promise(r => openNote(title, html, key, r)); }

// ---- 9 · „Außenstelle 3“ (Gully → Atlantschiss): Justin hält den Deckel, unten „Aus!“, Schachtkreide, Kiste, Lieferschein (−5), tiefes Wasser, RH-9
async function neben3_gully() { if (state.talking) return; const st = neben3_st('ast3');
  if (neben3_frei()) { neben3_start('k3_ast3', { x: 9, z: -1.3 }); if (neben3_justinDa(20) && !st.deckel) { st.deckel = 1; state.talking = true; await say([['„Unter der Erde sieht sie keinen. Das heißt auch: Da unten hört sie mich nicht. Geh du. Ich halte den Deckel.“', 5800, JS]]); state.talking = false; } }
  if (typeof whiskey_setzen === 'function' && typeof whiskey_S !== 'undefined' && whiskey_S.g) try { whiskey_setzen(9.6, .18, -1.1); } catch (e) {}
  enterCanal(); }
function neben3_kanalBau() { const S = neben3_S; if (S.kanal || !canal.loaded || !canal.points.length) return; S.kanal = true;
  const P = canal.points, sp = canal.spawn, far = P.slice().sort((a, b) => b.distanceTo(sp) - a.distanceTo(sp)), kiste = far[Math.min(3, far.length - 1)], tief = P[Math.floor(P.length * .3)] || sp;
  neben3_ort(sp.x - .9, sp.y + 1.2, sp.z, .5, 1.4, .8, 'Kreide an der Schachtwand', () => { const st = neben3_st('ast3'); openNote('Kreide an der Schachtwand', '<i>Kinderkreide, alt:</i>\n\n<span class="hand">ATLANTSCHISS – ENTDECKT VON JONAS W. + LUKE B.</span>', 'k3_atlantschiss', () => { if (!st.kreide) { st.kreide = 1; say([['„Wir waren hier. Nein. Wir haben nur durch die Schlitze geguckt. Runter hat sich keiner getraut.“', 5200, 'DU']]); } }); }, () => state.zone === 'canal');
  S.kisteM = null; kirchberg_mod('pallets_ms', 'model.gltf', 1.1, 'max').then(o => { if (o) { kirchberg_setze(o, kiste.x, kiste.y, kiste.z, .6); S.kisteM = o; } });
  neben3_ort(kiste.x, kiste.y + .5, kiste.z, 1.3, 1, 1.3, 'Die Kiste', () => neben3_kiste(), () => state.zone === 'canal' && !neben3_st('ast3').kiste);
  { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: moteTex, color: 0x9fd8ff, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); s.scale.setScalar(5); s.position.set(tief.x + 2.5, tief.y - 7, tief.z + 2.5); scene.add(s); S.tiefS = s; }
  neben3_ort(tief.x, tief.y + .8, tief.z, 1.6, 1.6, 1.6, 'Ins tiefe Wasser sehen', async () => { const st = neben3_st('ast3'); if (st.tief) return; st.tief = 1; state.talking = true;
    await say([['Weit unten liegt ein Licht, groß und ruhig. Es flackert nicht.', 3600], ['„Da unten liegt noch eins, und das ist ganz.“', 3400, 'DU']]); state.talking = false;
    if (Audio.ctx) { const d = Audio.at(tief.x + 20, tief.y + 2, tief.z + 25, 8); [220, 261.6, 329.6, 293.7].forEach((f, i) => { const o = Audio.osc('sine', f, i * 1.1, 4.5); const lp = Audio.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; o.connect(lp); Audio.env(lp, .035, 1.2, 3.2, i * 1.1, d); }); } // Kanon ohne Quelle (Schreck 1)
    neben3_ast3Check(); }, () => state.zone === 'canal' && !neben3_st('ast3').tief); }
async function neben3_kiste() { const st = neben3_st('ast3'); if (st.kiste || state.talking) return; st.kiste = 1;
  await neben3_note('Die Kiste', '<i>Auf einer Treppe am Wasser gestrandet, Deckel offen, Stroh, zwölf leere Mulden.</i>\n\n<b>BfR · AST 7 → AST 3 · LAGUNE\nProbe C · 12 Gläser · NICHT ÖFFNEN · NICHT FÜTTERN\nLagerung kühl, dunkel, unter Wasser.</b>\n\nDaran ein Lieferschein, durchnässt, Kuli: <span class="hand">„Zustellung gescheitert: Wasserstand. Zurück an Absender?“</span> Darunter eine zweite Hand: <span class="hand">„Absender siehe Empfänger.“</span>', 'k3_kiste');
  await say([['„Außenstelle drei. Also gibt’s mindestens drei. Super.“', 3400, 'DU']]);
  const a = await kirchberg_wahl(['Lieferschein mitnehmen', 'Liegen lassen']); if (a === 0) { modItem('n3_lieferschein', 'Lieferschein', 'BfR · AST 7 → AST 3 · LAGUNE. „Absender siehe Empfänger.“', 'paper'); addItem('n3_lieferschein'); if (typeof lwo_trust === 'function') lwo_trust(-5, 'k3_lieferschein'); }
  neben3_ast3Check(); }
function neben3_ast3Check() { const st = neben3_st('ast3'); if (neben3_q('k3_ast3') === 'done') return; const rh9 = ch3.armorHints && ch3.armorHints.has('RH-9');
  neben3_desc('k3_ast3', 'Atlantschiss: Kreide, zwei Nachbilder, die Kiste, das tiefe Wasser.');
  if (st.kiste && rh9) neben3_fertig('k3_ast3', 'Lost Eyengless ist nicht die einzige Außenstelle.'); }
function neben3_kanalTick(dt) { const S = neben3_S, st = neben3_st('ast3');
  if (state.zone === 'canal') { neben3_kanalBau(); S.imKanal = true; if (S.tiefS) S.tiefS.material.opacity = .42 + Math.sin(S.t * .7) * .06;
    if (typeof echoSeen !== 'undefined' && echoSeen.has('echo_kanal_laterne') && !state.talking && !(ch3.armorHints && ch3.armorHints.has('RH-9')) && neben3_k3()) { neben3_rh('RH-9'); neben3_ast3Check(); } }
  else if (S.imKanal) { S.imKanal = false; if (neben3_k3() && !st.zurueck) { st.zurueck = 1; setTimeout(() => { if (typeof whiskey_mimic === 'function') try { whiskey_mimic('pling', { force: true }); } catch (e) {} if (neben3_justinDa(25)) setTimeout(() => subtitle('„Das hat gedauert.“', 2600, JS), 1400); }, 1600); } } }

// ---- 7 · „Heimgehen“ (Friedhof, Grube am Reihenende)
function neben3_heimBau() { if (typeof ausbau_nord === 'undefined' || !ausbau_nord.pit) return; const P = ausbau_nord.pit, st = () => neben3_st('heim'), frei = () => neben3_auf('k3_heim');
  kirchberg_decal(kirchberg_tex(kirchberg_cnv(256, 96, (x, w, h) => { x.fillStyle = '#5a4430'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(240,238,230,.85)'; x.font = '44px "Caveat", cursive'; x.fillText('heimgehen', 24, 62); })), .5, .18, P.x + .95, .1, P.z + .4, -PI / 2, { rx: -PI / 2 + .2 });
  const stelle = (k, dx, dz, label, zeilen, item) => neben3_ort(P.x + dx, .6, P.z + dz, .9, 1, .9, label, async () => { const s = st(); neben3_start('k3_heim', { x: P.x, z: P.z }); if (s[k]) return; s[k] = 1; state.talking = true; await say(zeilen); state.talking = false;
    if (item) { modItem('n3_schuh', 'Kinderschuh, rechts', 'Größe 33, rechts, Klettverschluss. Nur einer.', 'paper'); addItem('n3_schuh'); } neben3_heimCheck(); }, () => frei() && !st()[k]);
  stelle('stein', 0, -1.55, 'Der neue Stein', [['LUKE BRANDT · 2009 – 2026. Grauer Granit, die Kanten scharf.', 3600], ['„Zweitausendneun. Nicht mein Geburtsjahr. Das, in dem ich … angefangen hab.“', 4600, 'DU']]);
  stelle('kreide', .95, .4, 'Kreide am Brett', [['„Kinderkreide. Frisch. Heimgehen. Wer schreibt so was an ein Grab?“', 4000, 'DU']]);
  stelle('schuh', 0, .2, 'In die Grube sehen', [['Ein Kinderschuh, Größe 33, rechts, Klettverschluss.', 3200], ['„Nur einer.“', 1800, 'DU']], true);
  stelle('knie', -.1, -1.05, 'Abdruck am Kopfende', [['In der frischen Erde ein tiefer Abdruck, ein Knie, groß und schwer, wie von einem Mann in viel Metall.', 4800]]);
  neben3_ort(P.x, .4, P.z + .1, 1.4, .6, 2, 'Probeliegen?', async () => { const s = st(); s.probe = 1; await say([['„Nein.“', 1600, 'DU']]); neben3_fertig('k3_heim', 'Sauber ausgehoben. Jemand hat mich eingeplant.');
    if (!story.lore.some(l => l.key === 'k3_mein_grab')) story.lore.push({ key: 'k3_mein_grab', title: 'Mein Grab', html: '<span class="hand">Sauber ausgehoben. Jemand hat mich eingeplant.</span>' }); }, () => frei() && ['stein', 'kreide', 'schuh', 'knie'].every(k => st()[k]) && !st().probe); }
async function neben3_heimCheck() { const s = neben3_st('heim'); if (!['stein', 'kreide', 'schuh', 'knie'].every(k => s[k]) || s.atem) return; s.atem = 1; await wait(1200); // Schreck 2: die Erde am Grund hebt und senkt sich einmal
  const P = ausbau_nord.pit; if (Audio.ctx) { const n = Audio.noise(false), lp = Audio.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; n.connect(lp); Audio.env(lp, .25, 1.2, 1.6, 0, Audio.at(P.x, -.5, P.z, 2)); n.stop(Audio.ctx.currentTime + 3.5); }
  shake = .012; if (typeof spannung_mark === 'function') try { spannung_mark('welt2'); } catch (e) {} await wait(2600); say([['„Rechte Winkel. Wer das war, hat’s ernst gemeint. … Ich hätte gern gewusst, ob ich reinpasse. Nein. Hätte ich nicht.“', 6200, 'DU']]); }

// ---- 8 · „Klar!“ (Karussell): nach dem Anschieben das Nachbild „Sommerfest 2009“
function neben3_klarHuelle() { const h = neben3_hitSuchen('Karussell anstoßen', 34, 71.2, 2.5); if (!h || h.userData.n3) return; h.userData.n3 = true; const alt = h.userData.action;
  h.userData.action = () => { alt(); if (!neben3_auf('k3_klar') || neben3_st('klar').los || state.talking) return; neben3_st('klar').los = 1; neben3_start('k3_klar', { x: 34, z: 71.2 }); neben3_klar(); }; }
async function neben3_klar() { await say([['„Ich dreh nachts allein ein Karussell an. Mit sechsundzwanzig. Wenn mich einer sieht, zieh ich weg.“', 5200, 'DU']]); await wait(2500);
  const E = { id: 'echo_k3_klar', at: [33, 1.1, 69.4], title: 'Nachbild · Sommerfest 2009', figs: [E_(33.4, 70.4, 0, .58), E_(34.8, 70.6, -.6, .58), E_(33.9, 69.6, .3, .58)],
    lines: [['Sommerfest. Lampions an einer Leine, Bratwurstrauch, das Karussell, sieben Sitze besetzt.', 4600], ['Daneben ein blasses Mädchen im Sommerkleid. „Darf ich mitspielen?“ Die anderen gucken weg.', 4800], ['Ein Junge mit blauen Augen rutscht zur Seite. „Klar!“', 3600], ['Er nimmt ihre Hand. Sie lässt nicht mehr los.', 3400]] };
  if (!ECHOES.includes(E)) addEcho(E); await playEcho(E);
  await say([['Ich weiß noch, wie das Eis geschmeckt hat. Waldmeister. Aber an das Mädchen erinnere ich mich nicht.', 5000, 'LUKE']]); await wait(900); await say([['„Er hat Klar gesagt. Ich hätte weggeguckt.“', 3200, 'DU']]);
  if (typeof ausbau_nord !== 'undefined' && ausbau_nord.merry) { ausbau_nord.merry.w += .9; setTimeout(() => Audio.play('woodSqueak2', { gain: .3, rate: .7, x: 34, y: .6, z: 71.2, ref: 2 }), 2600); } // dreht sich noch eine halbe Runde, der achte Sitz knarzt
  neben3_merk('klar'); neben3_fertig('k3_klar', '„Er hat Klar gesagt. Ich hätte weggeguckt.“');
  if (neben3_justinDa(18)) { await wait(4200); await say([['„Ein Rad, das niemanden irgendwohin bringt. Zum Vergnügen?“', 3600, JS], ['„Ja.“', 1400, 'DU'], ['„Eure Zeit ist seltsam.“', 2600, JS]]); } }

// ---- 11 · „Der Bus um 03:13“ (Haltestelle Kirchberg, wie AG-09): Warten → Bus ohne Fahrer → Fahrt im Dunkeln → Hof
function neben3_busTick(dt) { const st = neben3_st('bus'); if (st.fertig || !neben3_auf('k3_bus') || state.talking) return; const B = LWO_K3.bank;
  if (Math.hypot(player.pos.x - B[0], player.pos.z - B[1]) < 4.5) st.warte = (st.warte || 0) + dt; else st.warte = 0;
  if (st.warte > 30) { st.warte = 0; neben3_bus(); } }
async function neben3_bus() { const st = neben3_st('bus'); if (state.talking) return; state.talking = true; neben3_start('k3_bus'); if (typeof ausbau_nord !== 'undefined' && ausbau_nord.bus) ausbau_nord.bus.phase = 'done';
  let eng = null; try { eng = Audio.play('carEngine', { loop: true, gain: .5, lp: 420, rate: .6, x: 30, y: .8, z: 56, ref: 6 }); await say([['Ein Diesel ohne Scheinwerfer. Ein alter Bus hält, grau: AMT FÜR RÜCKFÜHRUNG · FAHRDIENST. Zielanzeige: HOHER ABGRUND.', 5400], ['Die Tür zischt auf. Kein Fahrer.', 2600]]);
    if (neben3_justinDa(25)) await say([['„Ich reite nicht in Kästen.“', 2400, JS]]);
    state.talking = false; const a = await kirchberg_wahl(['Einsteigen', 'Stehen bleiben']); state.talking = true; if (a !== 0) { await say([['Die Tür schließt sich. Der Bus fährt in den Nebel.', 3000]]); return; }
    await fade(1, 900); Audio.play('metalClose', { gain: .5, rate: .8 }); await wait(600); Audio.beep(false);
    const karte = story.items.includes('nord_fahrkarte') || story.lore.some(l => l.key === 'nord_fahrkarte');
    await say([['Der Entwerter piept rot.', 2200], ...(karte ? [['„Kinderfahrkarte. Ich bin sechsundzwanzig. Laut Pass.“', 3200, 'DU'], ['Der Drucker setzt ins leere Zielfeld: HOF.', 3000]] : [['Luke hat keine Fahrkarte. Der Bus fährt trotzdem.', 3000]]),
      ['Hinten sitzen Kinder in Kleidern aus verschiedenen Jahrzehnten, grau, ohne Mund, mit dem Gesicht nach vorn.', 5000], ['Jedes dreht den Kopf, sobald du an ihm vorbei bist.', 3400], ['Du drehst dich um: Alle sehen dich an. Du drehst dich nach vorn: hinter dir raschelt Stoff.', 5000],
      ['Auf dem vorletzten Sitz ein ausgelecktes, zum Dreieck gefaltetes Bonbonpapier.', 3800], ['„Warm. Da hat gerade jemand gesessen. Jemand Kleines.“', 3400, 'DU']]);
    if (typeof spannung_mark === 'function') try { spannung_mark('welt2'); } catch (e) {}
    player.pos.set(-118.5, 0, -18.5); player.yaw = -PI / 2; vel.set(0, 0, 0); if (neben3_justinDa(400)) jPlace(-121.5, -20.5, PI / 2); await wait(400); fade(0, 1400);
    if (typeof whiskey_setzen === 'function' && typeof whiskey_S !== 'undefined' && whiskey_S.g) try { whiskey_setzen(-127, 7.2, -30); } catch (e) {}
    await say([['Halt am Hof, an den Traktorspuren. Der Bus fährt in den Nebel und kommt am anderen Ende nicht heraus.', 5000]]);
    st.fertig = 1; if (karte) story.lore.push({ key: 'k3_fahrkarte_hof', title: 'Kinderfahrkarte, entwertet', html: 'nach: <b>HOF</b>' });
    if (!story.lore.some(l => l.key === 'k3_linie7')) story.lore.push({ key: 'k3_linie7', title: 'Linie 7', html: '03:13 – nur für Kinder. Der Bus hält tatsächlich. Kein Fahrer. Er hat mich zum Hof gebracht.' });
    neben3_fertig('k3_bus', 'Linie 7. Ziel: Hof.'); }
  finally { if (eng) eng.stop(1.5); state.talking = false; if (+$('fade').style.opacity > 0) fade(0, 600); } }

// ---- 5 · „Ich hol sie selbst“ (Briefkasten am Villa-Tor, SB-06)
function neben3_villaBau() { const x = -123.2, z = 55.4; kirchberg_mod('mailbox2', 'model.gltf', 1.25).then(o => { if (o) kirchberg_setze(o, x, kirchberg_boden(x, z), z, PI); });
  neben3_ort(x, 1.1, z, .7, .8, .7, 'Überquellender Briefkasten', async () => { const st = neben3_st('selbst'); neben3_start('k3_selbst', { x, z });
    if (!st.post) { st.post = 1; await neben3_note('Die Post eines toten Mannes', '„Letzte Mahnung: Ihr Abonnement ‚Schach heute‘ (Dr. Th. Seiler)“\nEin Prospekt: „Treppenlift – jetzt 20 % sparen“\nEine Karte: „Sie haben gewonnen!“', 'k3_seiler_post'); await say([['„Er ist seit Jahren tot, und die Post schreibt ihm noch. Die Einzige im Dorf, die nicht aufgibt.“', 5000, 'DU']]); return; }
    st.sb = 1; if (typeof sammeln_sb === 'function') await new Promise(r => { ui.pendingClose2 = r; sammeln_sb(6); });
    await say([['Theodor. Am Tor steht ‚Dr. Th. Seiler‘. Und Heinrich …', 3800, 'LUKE']]);
    if (typeof ausbau_ost_west_OW !== 'undefined') ausbau_ost_west_OW.villaDark = 20; // oben geht das Fenster aus
    for (let i = 0; i < 4; i++) setTimeout(() => Audio.stepAt && Audio.stepAt(x - 2 - i * .8, z + 3 + i * 1.2, .25), 1800 + i * 380);
    if (!story.lore.some(l => l.key === 'k3_grete')) story.lore.push({ key: 'k3_grete', title: 'Ich hol sie selbst', html: '<span class="hand">Grete, sechs, auf einem Stuhl. Wer ist Heinrich?</span>' });
    await wait(2600); await say([['„Er hat ihn getreten. Einen Ritter. Mit Kinderschuhen.“', 3200, 'DU']]); neben3_merk('k3_selbst'); neben3_fertig('k3_selbst', 'Grete, sechs, auf einem Stuhl. Wer ist Heinrich?'); },
    () => neben3_auf('k3_selbst')); }

// ---- 6 · „Bitte lächeln, Sie werden gefilmt“ (Tankstelle: Monitor, Band mit sieben Standbildern, RH-8)
const NEBEN3_BAND = ['Mike an der Kasse, Tankstellenjacke, er liest.', 'Er sieht auf. An Säule 3 steht ein Kind mit einer Laterne, barfuß.', 'Mike zieht die Schuhe aus und stellt sie nebeneinander an die Säule.', 'Er geht hinaus. Von oben fällt ein Lichtkegel auf den Hof und sucht.',
  'Am Rand des Kegels steht ein Mann in Rüstung, den Mund offen, er ruft. Der Kegel gleitet über den Asphalt links und rechts von ihm, nie über ihn. Er bleibt grau im Weiß.', 'Der Hof ist leer. Die Schuhe stehen da.', 'Uhr im Bild: 03:13. Schwarz. Dann drückt sich ein graues Kindergesicht ohne Mund von innen gegen die Linse.'];
function neben3_bandBau() { neben3_ort(114.2, 1.4, 24.6, .8, .8, .6, 'Monitor über der Kasse', () => neben3_band(), () => neben3_auf('k3_band'));
  neben3_ort(116.6, 1.2, 22.2, 1.4, 1.6, 1.4, 'Aufkleber an der Tür', () => toast('„Bitte lächeln, Sie werden gefilmt.“ Darunter, zwei Millimeter groß, ein Auge.', 3600), () => neben3_auf('k3_band')); }
function neben3_bandTick() { const st = neben3_st('band'); if (st.hin || !neben3_auf('k3_band') || Math.hypot(player.pos.x - 114, player.pos.z - 22) > 9 || state.talking) return; st.hin = 1; neben3_start('k3_band', { x: 114, z: 22 });
  say([['„Das ganze Dorf ist dunkel, und die Tankstelle hat Strom. Wer zahlt hier die Rechnung?“', 4400, 'DU']]); }
function neben3_band() { const st = neben3_st('band'); neben3_start('k3_band'); let i = 0, zurueck = false;
  const bild = (n, gesicht) => { const c = kirchberg_cnv(480, 300, (x, w, h) => { x.fillStyle = '#1a201c'; x.fillRect(0, 0, w, h); for (let k = 0; k < 2600; k++) { x.fillStyle = `rgba(200,220,200,${Math.random() * .08})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      x.fillStyle = 'rgba(170,190,170,.35)'; x.fillRect(40, 190, 400, 6); x.fillRect(300, 80, 40, 110); x.fillStyle = 'rgba(200,220,200,.8)'; x.font = '16px monospace'; x.fillText(`AUSSENKAMERA  BILD ${n + 1}/7`, 12, 22); x.fillText(n === 6 ? '03:13' : '03:1' + Math.min(2, n), w - 64, 22);
      if (n === 4) { const g = x.createRadialGradient(240, 170, 10, 240, 170, 150); g.addColorStop(0, 'rgba(240,250,255,.8)'); g.addColorStop(1, 'rgba(240,250,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(90,95,100,.95)'; x.fillRect(372, 120, 22, 70); x.beginPath(); x.arc(383, 112, 11, 0, 7); x.fill(); }
      if (gesicht) { const s = gesicht; x.fillStyle = 'rgba(130,134,138,.92)'; x.beginPath(); x.ellipse(240, 150, 30 * s, 40 * s, 0, 0, 7); x.fill(); x.fillStyle = '#050505'; x.beginPath(); x.ellipse(240 - 11 * s, 140, 6 * s, 9 * s, 0, 0, 7); x.ellipse(240 + 11 * s, 140, 6 * s, 9 * s, 0, 0, 7); x.fill(); } }); return c.toDataURL('image/jpeg', .8); };
  openPuzzle(`<div class="n3"><h3>Rekorder · „Außenkamera · NICHT ÜBERSPIELEN“</h3><div class="reihe"><div class="bild" style="height:auto"><img id="n3band" style="width:480px;height:300px" src="${bild(0)}"></div><div class="txt" id="n3bandT"></div></div><div class="knoepfe"><button id="n3z">◀◀</button><button id="n3v">▶</button><button id="n3u">Bild untersuchen</button></div></div>`, box => {
    box.classList.add('n3box'); const img = box.querySelector('#n3band'), T = box.querySelector('#n3bandT');
    const zeig = () => { img.src = bild(i, zurueck ? (7 - i) * .9 : i === 6 ? 1 : 0); T.innerHTML = `<b>Bild ${i + 1}</b>${NEBEN3_BAND[i]}`; }; zeig();
    box.querySelector('#n3v').onclick = e => { e.stopPropagation(); if (i < 6) { i++; zeig(); } };
    box.querySelector('#n3z').onclick = e => { e.stopPropagation(); if (!st.gesehen7 && i < 6) return; st.gesehen7 = 1; zurueck = true; if (i > 0) { i--; zeig(); Audio.stinger && Audio.stinger(false); } if (i === 0) { T.innerHTML += '<div class="luke"><i>In seinen schwarzen Augen spiegelt sich Mike an der Kasse. Stopp. Das Band springt heraus.</i></div>'; st.fertig = 1; } };
    box.querySelector('#n3u').onclick = e => { e.stopPropagation(); if (i === 6) st.gesehen7 = 1; if (i === 4) { T.innerHTML += '<div class="luke">„Das Licht geht um ihn rum. Als wär er ein Loch im Bild. … Nein. Als wär er ein Stück vom Licht.“</div>'; neben3_rh('RH-8'); } }; });
  ui.onClose = async () => { if (!st.fertig || st.ende) return; st.ende = 1; if (!story.lore.some(l => l.key === 'k3_das_band')) story.lore.push({ key: 'k3_das_band', title: 'Das Band', html: '<span class="hand">Die Kamera hat Mike gesehen. Sie hat sie gesehen. Ihn nicht.</span>' });
    const a = await kirchberg_wahl(['Kassette mitnehmen', 'Liegen lassen']); if (a === 0) { modItem('n3_kassette_band', 'Kassette „Außenkamera“', '„NICHT ÜBERSPIELEN“, darunter das Auge.', 'paper'); addItem('n3_kassette_band'); if (typeof lwo_trust === 'function') lwo_trust(-3, 'k3_kassette'); }
    neben3_fertig('k3_band', 'Die Kamera hat Mike gesehen. Sie hat sie gesehen. Ihn nicht.');
    if (neben3_justinDa(25)) setTimeout(() => say([['„Die Tür will mich nicht.“', 2400, JS], ['„Die will keinen. Die ist so.“', 2600, 'DU'], ['„Dann warte ich bei den Krügen.“', 2600, JS]]), 1500); }; }

// ---- 20 · „Zweiundvierzig Kerben“ (Justins Lager in der Scheune)
function neben3_kerbenBau() { const OW = typeof ausbau_ost_west_OW !== 'undefined' ? ausbau_ost_west_OW : null, L = OW && OW.f3 && OW.f3.lager, R = OW && OW.dbg && OW.dbg.barnRect; if (!L || !R) return;
  const st = () => neben3_st('kerben'), stelle = (k, x, y, z, label, zeile) => neben3_ort(x, y, z, .8, .8, .8, label, async () => { neben3_start('k3_kerben', { x: L.x, z: L.z }); const s = st(); if (s[k]) return; s[k] = 1; state.talking = true; await say([zeile]); state.talking = false; neben3_kerbenCheck(); }, () => neben3_auf('k3_kerben') && !st()[k]);
  stelle('stein', L.x - .05, .35, L.z + .75, 'Kerben im Fundamentstein', ['Unter dem Zeichen neun Kerben, alt, glattgewaschen. Unter der ersten ist ein kleiner Turm über einem Strich geritzt.', 5000]);
  stelle('balken', L.x + .3, 2.3, L.z, 'Kerben im Balken', ['Achtundzwanzig Kerben. Neben der sechsundzwanzigsten ist ein Rabenfuß eingeritzt.', 4200]);
  stelle('birke', R.x0 - .6, 1.2, L.z + 1.2, 'Kerben in der Birke', ['Fünf Kerben. Die letzte ist frisch, der Saft ist noch nass.', 3600]); }
async function neben3_kerbenCheck() { const s = neben3_st('kerben'); if (!(s.stein && s.balken && s.birke) || s.fertig) return; s.fertig = 1; state.talking = true;
  await say([['Neun, achtundzwanzig, fünf. Zweiundvierzig. Er hat immer das genommen, was noch stand. Erst Stein. Dann Holz. Dann den Baum.', 6200, 'LUKE']]);
  if (neben3_justinDa(15)) await say([['„Ich hab sie gezählt. Damit ich weiß, wie oft ich sie nicht gefunden hab.“', 4400, JS]]);
  await say([['„Er führt Strichliste. Wie Vegas bei den Pfandflaschen.“', 3400, 'DU']]); state.talking = false;
  if (!story.lore.some(l => l.key === 'k3_zweiundvierzig')) story.lore.push({ key: 'k3_zweiundvierzig', title: 'Zweiundvierzig', html: '<span class="hand">Neun im Stein, achtundzwanzig im Balken, fünf in der Birke. Eine davon ist von heute.</span>' });
  neben3_fertig('k3_kerben', 'Neun im Stein, achtundzwanzig im Balken, fünf in der Birke. Eine davon ist von heute.'); }

// ---- 10 · „Leg sie auf den Ort“ (Dina; Remise fehlt noch → Scheune am Hof), Butterbrotpapier umdrehen, RH-5
function neben3_dinaBau() { const OW = typeof ausbau_ost_west_OW !== 'undefined' ? ausbau_ost_west_OW : null, R = OW && OW.dbg && OW.dbg.barnRect; if (!R) return; const x = R.x1 - 1.1, z = (R.z0 + R.z1) / 2 - 1.2; neben3_S.dinaP = [x, z];
  kirchberg_mod('haybale', 'model.gltf', .9, 'max').then(o => { if (o) kirchberg_setze(o, x, 0, z, .3); });
  neben3_ort(x, .9, z, 1.2, 1.6, 1.2, 'Dina', () => neben3_dina(), () => neben3_auf('k3_ort')); }
async function neben3_dinaFigur() { const S = neben3_S; if (S.dina || S.dinaLaed || !S.dinaP || typeof kirchberg_figur !== 'function') return; S.dinaLaed = true;
  const F = await kirchberg_figur('dina_k3', { id: 'dina', speed: .8 }); if (!F) return; S.dina = F; F.g.position.set(S.dinaP[0], .38, S.dinaP[1]); F.g.rotation.y = -PI / 2; lwo_clip(F, F.acts.sit ? 'sit' : 'idle'); lwo_blick(F, 'luke'); F.g.visible = true; }
async function neben3_dina() { const st = neben3_st('ort'), F = neben3_S.dina, D = 'DINA', sag = z => typeof kirchberg_sag === 'function' ? kirchberg_sag(F, z.map(l => [l[0], l[1], l[2] || D])) : say(z); if (state.talking) return; neben3_start('k3_ort'); state.talking = true;
  try { if (!st.hallo) { st.hallo = 1; await sag([['„Du atmest wie ein Staubsauger, Luke. Setz dich.“', 3400]]); if (neben3_q('k3_stein') === 'done') await sag([['„Du warst bei Mama. Die hat im Schlaf mit mir geredet. Das tut sie nur, wenn einer da war.“', 5200]]);
      await sag([['„Ich mach die Augen nicht auf, bis es hell ist. Ich hab’s einmal gemacht. Da hat sie zurückgeguckt.“', 5200]]);
      await sag([['„Leg sie auf den Ort.“', 2000], ['„Welchen Ort?“', 1600, 'DU'], ['„Den, der von unten so aussieht.“', 2600]]);
      await sag([['„Das ist von Pat und Patachon, oder? Die lassen das überall liegen.“', 3600, 'DU'], ['„Die essen jeden Tag Leberwurst.“', 2400]]); }
    state.talking = false; if (!st.geloest) await neben3_papier(); state.talking = true;
    if (st.geloest && !st.bild) { st.bild = 1; await sag([['„Ich mal ihn immer mit. Ich weiß nicht, wer das ist. Er steht immer da.“', 4200]]);
      await neben3_note('Dinas Zeichnung', '<i>Wachsmalstift: das Laternenfest, Kinder mit Lampions. Am Rand ein grauer Fleck mit Beinen, ohne Gesicht, so fest gemalt, dass das Papier glänzt.</i>', 'k3_dina_bild'); neben3_rh('RH-5');
      await sag([['„Sie guckt dich an, Luke. Von innen.“', 3000]]); neben3_fertig('k3_ort', 'Vier Kreise: Nr. 5, Nr. 3, Nr. 1, Nr. 7. Von unten.'); } }
  finally { state.talking = false; } }
function neben3_papier() { const st = neben3_st('ort'); let um = false;
  const zeichne = () => kirchberg_cnv(420, 300, (x, w, h) => { x.fillStyle = '#e6dcc0'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(80,70,50,.5)'; x.lineWidth = 3; x.beginPath(); x.moveTo(20, 150); x.lineTo(400, 150); x.stroke(); x.font = '22px Georgia'; x.fillStyle = '#3a3226';
    x.fillText('Flurkarte · Ahornstraße', 14, 26); const H = [[70, 'Nr. 1'], [150, 'Nr. 3'], [230, 'Nr. 5'], [310, 'Nr. 7']]; for (const [hx, t] of H) { x.strokeRect(hx - 22, 160, 44, 36); x.fillText(t, hx - 22, 220); } x.strokeRect(340, 60, 40, 60); x.fillText('Kapelle', 322, 52);
    x.save(); if (um) { x.translate(w, 0); x.scale(-1, 1); } x.globalAlpha = .75; x.strokeStyle = 'rgba(40,40,40,.9)'; x.lineWidth = 3; const K = [[230, '1'], [150, '2'], [70, '3'], [310, '4']];
    for (const [kx, n] of (um ? K : K.map(([kx, n]) => [w - kx, n]))) { x.beginPath(); x.arc(kx, 178, 18, 0, 7); x.stroke(); x.save(); if (um) { x.translate(kx, 0); x.scale(-1, 1); x.translate(-kx, 0); } x.fillStyle = '#222'; x.fillText(n, kx - 6, 186); x.restore(); }
    x.beginPath(); const tx = um ? 360 : w - 360; x.moveTo(tx - 12, 120); x.lineTo(tx, 70); x.lineTo(tx + 12, 120); x.stroke(); x.restore(); }).toDataURL();
  return new Promise(r => { openPuzzle(`<div class="n3"><h3>Butterbrotpapier auf der Flurkarte</h3><div class="reihe"><div class="bild" style="height:auto"><img id="n3pap" style="width:420px;height:300px" src="${zeichne()}"></div><div class="txt" id="n3papT">Vier Kreise, ein Kirchturm, eine Straße. So, wie es gezeichnet ist, passt nichts.</div></div><div class="knoepfe"><button id="n3dreh">Papier umdrehen</button><button id="n3hilf">Hm.</button></div></div>`, box => {
    box.classList.add('n3box'); const img = box.querySelector('#n3pap'), T = box.querySelector('#n3papT'); let h = 0;
    box.querySelector('#n3dreh').onclick = e => { e.stopPropagation(); um = !um; img.src = zeichne(); Audio.paper && Audio.paper();
      if (um) { st.geloest = 1; T.innerHTML = 'Von unten. Der Kirchturm liegt auf der Kapelle. Die Kreise 1 bis 4 liegen auf <b>Nr. 5, Nr. 3, Nr. 1, Nr. 7</b>.';
        if (!story.lore.some(l => l.key === 'k3_vier_kreise')) story.lore.push({ key: 'k3_vier_kreise', title: 'Vier Kreise', html: 'Dinas Butterbrotpapier, von unten auf die Flurkarte gelegt: 1 – Nr. 5 · 2 – Nr. 3 · 3 – Nr. 1 · 4 – Nr. 7.' }); } else T.textContent = 'So passt nichts.'; };
    box.querySelector('#n3hilf').onclick = e => { e.stopPropagation(); T.innerHTML = ['„Die Kapelle ist auf der falschen Seite.“', 'DINA: „Von unten, hab ich gesagt. Nicht von oben.“', 'Butterbrotpapier. Man kann durchgucken. Von beiden Seiten.'][Math.min(2, h++)]; }; });
    ui.onClose = r; }); }

// ---- 15 · „Ja.“ (Nr. 2) · 16 · „Schläft wie ein Stein“ (Nr. 8) · 17 · „Damit keiner fehlt“ (Nr. 6)
function neben3_strasseBau() {
  neben3_ort(-51.45, 1.1, 6.72, .6, .6, .6, 'Neue Postkarte', async () => { const st = neben3_st('ja'); neben3_start('k3_ja', { x: -51.5, z: 6.7 }); st.n = (st.n || 0) + 1;
    if (st.n === 1) await neben3_note('Eine Postkarte, trocken', '<i>Keine Briefmarke, kein Stempel. Heute Nacht eingeworfen.</i>\n\nVorderseite: die Ahornstraße bei Nacht, von hoch oben. Alle Laternen brennen, genau über jeder Laterne ein kleiner heller Punkt.\n\nRückseite: An: Heidi W. Darunter, sonst nichts, in Kinderschrift mit Bleistift:\n\n<span class="hand" style="font-size:1.6em">Ja.</span>', 'k3_ja');
    await say([[['Das ist Heidis Schrift. Heidi mit acht.', 'Das hat keine Heidi geschrieben. Das hat jemand geschrieben, der Heidis Schrift gesammelt hat.', 'Von oben. So hoch fliegt hier keiner.'][Math.min(2, st.n - 1)], 3800, 'LUKE']]);
    if (st.n >= 3) { setTimeout(() => Audio.play('metalHit1', { gain: .18, rate: 1.6, x: -51.45, y: 1.1, z: 6.72, ref: 2 }), 1400); neben3_fertig('k3_ja', 'Die Antwort auf „Sind sie wieder da?“'); } }, () => neben3_auf('k3_ja'));
  neben3_ort(-50, 1.2, 12.3, 1.2, 1.2, .5, 'Schild am Gartentor', () => { toast('„Objekt frei ab sofort. Ruhige Lage.“', 3000); setTimeout(() => say([['„Ruhig. Ja. Tagsüber bestimmt.“', 2400, 'DU']]), 1600); }, () => neben3_auf('k3_ja'));
  neben3_ort(46, 1.3, 12.2, 1.4, 1.8, .6, 'Die Haustür ist angelehnt', () => neben3_aydin(), () => neben3_auf('k3_stein'));
  neben3_ort(22, 1.1, 12, 1.8, 1.6, 1.2, 'Die Treppe von Nr. 6', () => neben3_hilde1975(), () => neben3_auf('k3_fehlt') && !neben3_st('fehlt').n1);
  neben3_ort(22.9, 1.5, 12.1, .5, .5, .4, 'Schild an der Haustür', () => { toast('„Keine Werbung. Keine Zeugen Jehovas. Kein Amt.“', 3200); setTimeout(() => say([['„Drei Sachen. Zwei davon klingeln donnerstags.“', 2800, 'DU']]), 1700); }, () => neben3_auf('k3_fehlt')); }
async function neben3_aydin() { const st = neben3_st('stein'); if (state.talking) return; neben3_start('k3_stein', { x: 46, z: 12 });
  if (!st.gesehen) { st.gesehen = 1; await say([['Frau Aydın steht am Fenster, die Hand an der Gardine, und rührt sich nicht. Drinnen versucht ein Wecker zu klingeln und schafft nur den Anfang.', 5600]]); }
  const opts = [!st.wecker && 'Wecker abstellen', !st.decke && 'Die Wolldecke um ihre Schultern legen', !st.stehen && 'Stehen bleiben', !st.foto && 'Das Foto auf der Fensterbank'].filter(Boolean); if (!opts.length) return;
  if (!st.wecker && Audio.ctx) { const d = Audio.at(46, 1.2, 14, 2); for (const t0 of [0, 1.4]) { const o = Audio.osc('square', 2200, t0, .35); Audio.env(o, .03, .005, .3, t0, d); } }
  const a = await kirchberg_wahl(opts), w = opts[a];
  if (w === 'Wecker abstellen') { st.wecker = 1; Audio.play('switch1', { gain: .3, x: 46, y: 1, z: 14, ref: 2 }); }
  else if (w === 'Die Wolldecke um ihre Schultern legen') { st.decke = 1; await say([['„Ich deck gerade eine Nachbarin zu, die im Stehen schläft. Um drei Uhr dreizehn. Das erzähl ich keinem.“', 5000, 'DU']]); }
  else if (w === 'Stehen bleiben') { st.stehen = 1; await wait(2500); await say([['„Dina. Augen zu, Schatz. Bis es hell ist.“', 3400, 'FRAU AYDIN (IM SCHLAF, GANZ LEISE)']]); }
  else { st.foto = 1; await neben3_note('Ein Foto auf der Fensterbank', 'Dina mit sieben, eine Holzgiraffe im Arm, unten eingebrannt „D.“', 'k3_dina_giraffe'); }
  if (st.wecker && st.decke && st.stehen) { neben3_merk('k3_stein'); neben3_fertig('k3_stein', 'Eine Mutter, die im Stehen schläft, damit ihr Kind die Augen zulässt.'); } }
async function neben3_hilde1975() { const st = neben3_st('fehlt'); if (state.talking || st.n1) return; st.n1 = 1; neben3_start('k3_fehlt', { x: 22, z: 12 });
  const E = { id: 'echo_k3_treppe6', at: [22, 1.1, 12.2], title: 'Nachbild · Treppe von Nr. 6, Sommer 1975', figs: [E_(22.3, 12.6, PI, .52), E_(19.5, 8, -PI / 2, .56), E_(20.5, 8, -PI / 2, .57), E_(21.5, 8, -PI / 2, .55), E_(18.4, 8, -PI / 2, 1.14)],
    lines: [['Sommernacht. Ein Mädchen im Nachthemd sitzt auf der Treppe und zählt Kinder, die barfuß die Straße herunterkommen.', 5200], ['„… fünf. Sechs.“ Ein Ritter bringt noch einen, einen Jungen mit braunen Augen. Sie zählt ihn nicht.', 5000], ['„Sechs. Es fehlt eine.“ Sie fängt von vorn an.', 3400], ['„Ich zähl, damit keiner fehlt.“', 3000]] };
  if (!ECHOES.includes(E)) addEcho(E); await playEcho(E); await say([['„Hilde. Mit neun. Und sie hat Peter nicht mitgezählt.“', 3600, 'DU']]); neben3_fehltCheck(); }
function neben3_fehltCheck() { const st = neben3_st('fehlt'); if (!st.n1 || neben3_q('k3_fehlt') === 'done') return;
  if (typeof echoSeen !== 'undefined' && echoSeen.has('echo_kreuzung')) { if (!st.neun) { st.neun = 1; setTimeout(() => subtitle('„… neun.“', 2200, 'HILDE'), 1500); }
    const html = '<span class="hand">Mit neun hat sie angefangen. Letzte Nacht hat sie aufgehört.' + (ch3.room2 ? ' Zähl für mich weiter, hat sie gesagt. Das hat sie noch nicht gesagt. Das sagt sie gleich.' : '') + '</span>';
    const i = story.lore.findIndex(l => l.key === 'k3_keiner_fehlt'); if (i >= 0) story.lore[i].html = html; else story.lore.push({ key: 'k3_keiner_fehlt', title: 'Damit keiner fehlt', html });
    neben3_fertig('k3_fehlt', 'Mit neun hat sie angefangen. Letzte Nacht hat sie aufgehört.'); } else neben3_desc('k3_fehlt', 'Das zweite Bild: die Kreuzung, 2009, mit Hildes Zählbuch und ohne Lampe.'); }

// ---- 12 · „Hast du dich an mich erinnert?“ (rote Wolle hinter Nr. 7, Anhänger, Anrufbeantworter; Rucksack/Kamera aus zayn.js)
function neben3_zaynBau() { const st = () => neben3_st('zayn');
  kirchberg_decal(kirchberg_tex(kirchberg_cnv(64, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#a0141a'; x.lineWidth = 5; x.beginPath(); x.moveTo(w / 2, 0); for (let y = 0; y < h; y += 8) x.lineTo(w / 2 + Math.sin(y * .3) * 6, y); x.stroke(); x.fillStyle = '#8a1016'; x.beginPath(); x.ellipse(w / 2, h - 30, 14, 22, 0, 0, 7); x.fill(); })), .12, .6, 24.2, .75, -23.4, 0, { alpha: true, double: true });
  neben3_ort(24.2, .8, -23.4, .8, 1.2, .8, 'Rote Wolle am Zaunpfahl', async () => { const s = st(); neben3_start('zayn'); if (state.talking) return;
    if (!s.knoten) { s.knoten = 1; state.talking = true; for (let i = 0; i < 4; i++) { Audio.play('woodHit3', { gain: .05, rate: 2.4 }); await wait(260); } await say([['„Vierzig Knoten. Jonas konnte bis zwölf keine Schleife binden. Aber Knoten.“', 4400, 'DU']]); state.talking = false; if (Audio.ctx) Audio.play('woodSqueak2', { gain: .12, rate: 2, x: 24.2, y: .8, z: -24.5, ref: 2 }); return; } // die Wolle spannt sich einmal
    s.anh = 1; await neben3_note('Ein Kofferanhänger aus Pappe', '<span class="hand">Wenn Zayn das findet: GEH DER WOLLE NACH. Die führt heim. Jonas</span>', 'k3_jonas_anhaenger');
    await say([['Er hat die Wolle im Wald angebunden und bei sich zu Hause aufgehört. Damit Zayn heimfindet. Vierzig Mal.', 5400, 'LUKE']]); neben3_zaynCheck(); }, () => neben3_frei() && !st().anh);
  const led = new THREE.Sprite(new THREE.SpriteMaterial({ map: moteTex, color: 0xff2010, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); led.scale.setScalar(.06); led.position.set(22.9, Y + .82, -12.6); scene.add(led); neben3_S.abLed = led;
  neben3_ort(22.9, Y + .8, -12.6, .5, .4, .5, 'Anrufbeantworter („Speicher voll“)', async () => { const s = st(); if (s.ab || state.talking) return; s.ab = 1; state.talking = true; neben3_start('zayn'); Audio.beep(true); await wait(700);
    await say([['„Mama. Ich bin’s. Sonntag, wie immer.“', 3200, 'JONAS'], ['„Du musst nicht rangehen. Ich ruf trotzdem an.“', 3400, 'JONAS']]); state.talking = false; neben3_zaynCheck(); }, () => neben3_frei() && !st().ab); }
function neben3_zaynCheck() { const s = neben3_st('zayn'); if (s.anh && s.ab && !s.k3) { s.k3 = 1; neben3_merk('zayn'); neben3_desc('zayn', 'Die Wolle führt in den Wald. Der Wald ist heute Nacht Nebel.'); } }

// ---- 13 · „Eine für sieben“: Schlüssel vom Tausch mit Whiskey (whiskey.js) → Pony und Automatenfoto
function neben3_cleoTick() { const s = neben3_st('cleo'); if (s.foto || !story.items.includes('baumhausschluessel') || !neben3_k3() || state.talking || ui.overlay) return; s.foto = 1; neben3_start('cleo');
  (async () => { await neben3_note('Der Schlüssel', 'Ein kleiner Messingschlüssel an einem rosa Plastikpony mit drei Beinen. In den Bart ist ein „C“ gefeilt.\n\nAm Bauch des Ponys ein Namensschildchen: <span class="hand">Wenn gefunden: Birkenweg</span>', 'k3_cleo_pony');
    await say([['Birkenweg. Da wohnt keiner. Da hat nie einer gewohnt. … Oder?', 4200, 'LUKE']]);
    await neben3_note('Im Sattel des Ponys', 'Ein gefaltetes Automatenfoto, vier Bilder untereinander: Lucy mit acht und ein Mädchen mit roten Zöpfen, das lachend wegguckt.\n\nRückseite, Lucys Schrift: <span class="hand">C + L. Beste Freundinnen für IMMER. Nicht vergessen!!</span>', 'k3_cleo_foto');
    await wait(1800); await say([['„Die andere hab ich noch nie gesehen.“', 3200, 'DU']]); neben3_desc('cleo', 'Der Schlüssel öffnet eine Kiste im Wald. Der Wald ist heute Nacht Nebel.'); })(); }

function neben3_minimalBau() { const S = neben3_S; if (S.minimal) return; S.minimal = true;
  for (const [n, f] of [['Heimgehen', neben3_heimBau], ['Klar', neben3_klarHuelle], ['Villa', neben3_villaBau], ['Band', neben3_bandBau], ['Kerben', neben3_kerbenBau], ['Dina', neben3_dinaBau], ['Straße', neben3_strasseBau], ['Zayn', neben3_zaynBau]]) { try { f(); } catch (e) { console.warn('neben3: ' + n, e); } } }
function neben3_minimalTick(dt) { const S = neben3_S; S.oT = (S.oT || 0) - dt; if (S.oT <= 0) { S.oT = .4; neben3_orteTick(); if (neben3_k3()) { neben3_cleoTick(); if (S.dinaP && !S.dina && Math.hypot(player.pos.x - S.dinaP[0], player.pos.z - S.dinaP[1]) < 35) neben3_dinaFigur(); neben3_fehltCheckT(); } }
  neben3_kanalTick(dt); if (neben3_k3()) { neben3_busTick(dt); neben3_bandTick(); }
  if (S.abLed) S.abLed.visible = neben3_frei() && !neben3_st('zayn').ab && Math.sin(S.t * 5) > 0; }
function neben3_fehltCheckT() { const st = neben3_st('fehlt'); if (st.n1 && !st.neun && typeof echoSeen !== 'undefined' && echoSeen.has('echo_kreuzung')) neben3_fehltCheck(); }
