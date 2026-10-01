// =====================================================================  SPANNUNG (Modul „spannung“): die Regie über alle Geräusch- und Schreck-Planer
// Kein Planer löst mehr auf eigene Faust aus. Vorher: spannung_ask(Familie, Klasse) – oder spannung_can(...) prüfen und nach Erfolg spannung_did(...) melden.
// Klassen: amb (Umgebung: Tiere, Holz, Wasser, Rohre …) · fear (Angst-Flüstern) · minor (Unerklärliches: Schritte, Kichern, Ketten, Stille …) · major (Gestalten, feste Schreckmomente).
// Regeln: Budget je Minute nach Ort und Spannung (je höher die Spannung, desto stiller die Natur) · Mindestabstand je Familie (Gedächtnis, nie dieselbe Familie
// zweimal hintereinander) · Pflicht-Ruhe nach jedem Höhepunkt (Schreckklang/großer Stinger) · in Gesprächen/Filmszenen nichts · Aufmerksamkeit: nichts „hinter dir“
// kurz nach einem Schreck · plötzliche Stille (spannung_hush) hält alle Planer an und senkt Regen/Wind auf 0,2 · stille Zonen an Fraßstelle und Bau der Hungrigen
// (25 m): alles verstummt bis auf hohen Wind in den Kronen, kein Nachhall – „der Wald hat kein Echo“.
//
// AP-26 (Fassung 3, „Umsetzung“ 5.6; 85 §10/§11; Grusel-Vergleich 5.1–5.9, A-25/A-26/A-28, Q-9):
//   Stufen 1/2/3: spannung_schreck(stufe, id) · spannung_dreier(id) (= Stufe 3) · spannung_peak() (Skript-Höhepunkt = Stufe 3) · spannung_mark('welt1'|'welt2'|'peak3').
//     Erkannt ohne Zutun: Kinosequenzen k1h, k2a, k2b, k3kuh, k3blinzeln; kapitel1_nichtDu/_danke, spiderEvent, villa_hoehepunktA/B, k5_augenAuf, k6_ag20,
//     hungrige_finale (Namens-Hülle); großer Stinger = Stufe 3, Schreckklang = Stufe 2, scareCount = Atempause ohne Höhepunkt.
//   Atempausen (A-28): nach Stufe 2/3 öffnet die Regie eine Pause – 50 % Lacher (gedanken_atem, A-01 … A-25), 30 % Stille (Luke sagt ≥ 20 s nichts),
//     20 % Ruhe mit Riss (nach 25 s eine kleine Stufe-1-Anomalie). Skript-Pausen aus Tabelle 5.6 (Pat und Patachon, Lesebrille, Slapstick …) melden spannung_pause(id).
//     Solange eine Dreier-Pause offen ist, gibt es keinen neuen Zufalls-Major („nie zwei Dreier ohne Atempause“); Verstöße stehen in SP.verstoss (Test).
//   Nach jedem Höhepunkt ändert sich SP.peak → beobachter.js schweigt 2–3 min (peakUntil). Nachklang: Stufe 2 → 60 s, Stufe 3 → 120 s keine Minor/Major.
//   Traurige Szenen (Sperrliste): hilde_strahl (Kino k1h) · tank (Kino k2b, Ende Kap. 2) · peter_tod (feuer.js: Peter nickt) · echter_luke (k5_stallSzene, k6_hochsitz)
//     · mamas_kerze (k5_kerzeAnzuenden). spannung_traurig() → bool (beobachter.js, gedanken.js) · spannung_trauer(id, sek) · spannung_trauerAn/Aus(id).
//     Dort: keine Atempause (Luke bleibt still), kein Zufallsschreck, keine Präsenz.
//   Stinger-Diät (A-26/5.9): scareSound('scream') nie (02 H4 „Luna schreit nie“) → Atem am Ohr und Ton-Abriss; Geige/Kreischen außerhalb des Kinos höchstens
//     einmal je Kapitel, danach Ton-Abriss (0,4 s). Knurren, Rauschen, Flüstern bleiben (diegetisch). Große Stinger behalten den Abstand aus klang.js (nicht doppelt drosseln).
//   Untertitel (A-25): erzählende Angst-Untertitel („Hinter dir: …“, „Irgendwo hinter dir: ein Kichern …“) entfallen; mit settings.geraeusche (Einstellungen →
//     „Geräusche als Untertitel“) erscheinen sie als Geräuschangabe in Klammern. spannung_geraeusch(text, ms) für andere Module.
//   5.1 Phasen: spannung_phase() → 0 Ruhe · 1 Unbehagen · 2 Präsenz · 3 Jagd · 4 Höhepunkt/Film · 5 Nachklang; Skripte setzen spannung_phase(n, grund, sek).
//   5.2 Stress SP.stress (0…1) aus Dunkel, Nähe, Nachklang, Rennen, schwacher Lampe; spannung_k() liest ihn. Herzschlag/Vignette macht die Basis (fear).
//     Lange ruhig (< 0,25 über 120 s) → nächste Präsenz frei · lange hoch (> 0,75 über 20 s) → 45 s keine neuen Minor. Gedanken ab 0,7 gesperrt (spannung_gedankenOk).
//   5.3 Präsenz ohne Kontakt: je Kapitel ein Wesen, nur Klang, ≥ 12 m im Augenwinkel/hinter Luke (Kombi · K-1 · Graukind · Blechmann · Graukind · wandernde Stille).
//   5.4 falsche Sicherheit: einmal je Kapitel nach 40–70 s Ruhe drinnen (oder spannung_safe(zone)) ein Schritt oben (Stufe 1).
//   5.5 leere Stille: bis zu zweimal je Kapitel 8–12 s alles weg, danach nichts.
//   5.6 Spielerverhalten: spannung_laerm() (Rennen 18 m, Gehen 6 m, Stehen 2 m; spannung_laerm(r, sek) für Klirren/Rufen) · spannung_sicht() (Lampe 30 m / 8 m) ·
//     häufiges Umdrehen → nichts mehr „hinter dir“ · lange gelesen (> 20 s) → 30 % ein Knarren hinter Luke · Fibel einmal je Kapitel.
//   5.7 Gewöhnung: mehr als vier Ereignisse einer Familie in zehn Minuten → Abstand ×1,8.   5.8 Kapitel aus kap(), Abstände [—, 85, 70, 60, 75, 55, 50].
//   Slapstick S-08 „Montag!“ (Kap. 1, nach W-03) läuft hier als Atempause; S-02 in albers.js; S-01/S-03/S-04/S-09/S-10 in ihren Kapitelmodulen.
//   Spielstand 'spannung': Stinger je Kapitel, falsche Sicherheit, leere Stille, Fibel, Slapstick.
const SP = { t: 0, amb: [], lastAmb: -99, lastFam: '', fam: {}, lastMinor: 0, lastMajor: 0, peak: -999, hushUntil: 0, silent: 0, hushV: 1, chase: false, tick: 0, n: { ok: 0, no: 0, abriss: 0 }, log: [], // lastMinor/lastMajor 0: zu Beginn erst ankommen lassen
  peak3: -999, hushLvl: .2, el: 0, sek: 0, famT: {},
  atem: { offen: false, stufe: 0, art: '', at: 0, ruhe: 0, anlass: '' }, pauseSeit: true, lastDreier: -1e9, dreierKap: 0, dreier: [], verstoss: [], k5Polaroid: 0,
  sad: 0, sadHold: new Set(), sadId: '', peterNick: false, kinoId: '', scares: -1,
  stress: 0, lowT: 0, highT: 0, minorSperre: 0, phaseMan: 0, phaseBis: 0,
  px: null, pz: null, speed: 0, laerm: 2, laermX: 0, laermBis: 0, yaw: null, drehAcc: 0, drehT: 0, dreh: [-99, -99, -99, -99], drehI: 0, umdrehT: -999, ovId: '', ovT: 0,
  praesT: 60, praesFrei: false, safeT: 0, safeZiel: 0, safeZone: '', leerRuhe: 0, leerT: -999, warStill: false, a12: 0, a23: 0, w03T: -1,
  stK: {}, safeK: {}, leerK: {}, fibelK: {}, sl: {} };
// Mindestabstand je Familie (s) – was fehlt, gilt 30 s
const SP_GAP = { owl: 75, fox: 200, deer: 120, crow: 60, twig: 14, rustle: 10, critter: 25, branch: 70, treeCreak: 30, flap: 40, drip: 4, gutter: 35, bark: 100, train: 420, howl: 240,
  gust: 12, creak: 22, settle: 15, pipe: 40, water: 45, window: 30, outside: 45, metal: 30, vent: 40, buzz: 50, door: 90, above: 150, upstairs: 150, fern: 30, grunt: 25,
  whisper: 35, steps: 150, giggle: 900, chains: 300, knock: 120, figure: 110, shutter: 60, dogcut: 240, car: 300, silence: 200, crows: 160, swing: 180, rats: 90, eyes: 20, lamp: 90, thump: 120, flicker: 60, window_fig: 150, beob: 20,
  praesenz: 90, lesen: 180, fibel: 60, sicher: 0 };
// Umgebungsereignisse je Minute nach Ort (bei voller Spannung die Hälfte)
const SP_AMB = { wald: 3, tief: 2, ort: 2, friedhof: 2, villa: 2, innen: 2, keller: 3, amt: 3, kanal: 3, weiss: 0 }; // Betten tragen die Kulisse – Einzelereignisse sparsam
// 5.8: Abstand zwischen Minor/Major je Kapitel (Kap. 4 bei Tag ruhiger, Kap. 5/6 dichter)
const SP_GAPKAP = [0, 85, 70, 60, 75, 55, 50, 50];
// 5.6 Schreckbudget (Bibel, „Umsetzung für Claude Code“): Dreier und Atempausen je Kapitel. Die Dreier-Kennungen sind die, unter denen die Regie sie erkennt
// (Kino-ID, Hülle oder spannung_dreier(id) aus dem Kapitelmodul); die Atempausen spielen die Kapitelmodule und melden sie mit spannung_pause(id).
const SP_BUDGET = {
  1: { dreier: ['k1_nichtdu', 'k1_danke', 'k1h'], pausen: ['Pat und Patachon', 'Foto „Jonas hat die Laterne angezündet“', 'Batterien im Dreieck', 'Heino-Zettel', 'Lesebrille', 'Vegas „Nicht ins Licht gucken!“'] },
  2: { dreier: ['k2_spinnen', 'k2a', 'k2b'], pausen: ['Post-it/Cello', 'Sachbearbeiter', '„Das Original hätte auch geschrien“', 'Lüftung + DANKE', 'Butterbrotpapier', '„Hey, Großer.“', 'Whiskey am Gully'] },
  3: { dreier: ['k3kuh', 'k3blinzeln'], pausen: ['Whiskey und das Wort', 'Justin/Schokoriegel', 'echte Lucy', 'zweiter Riegel', '„Kum!“', 'lange Pause vor dem Abgrund', '„Papa mogelt“'] },
  4: { dreier: ['k4_glas', 'k4_hand'], pausen: ['„UFO – passt nicht“', 'Whiskey auf dem Schwungrad', '„absichtlich knapp“', '„Ich bin wieder aufgetaut“', 'der Ring'] },
  5: { dreier: ['polaroid', 'k5_augenauf'], pausen: ['Kinderzimmer/Kerze', 'Lucy ganz, Whiskey klingelt', 'Katze jagt Whiskey'] }, // Atem + Polaroid: eine Sequenz, die einzige Doppelung
  6: { dreier: ['k6_ag19', 'k6_ag20', 'k6_hirsch', 'k6_hofer', 'k6_raben'], pausen: ['Lichtung/Baumhaus/Hütte', 'Wolle/Kerben', 'Trittstufe', 'Kühe Roy, Roland, Rex', 'Müsliriegel „Junge.“', 'Zeichnung/Polaroid', '„Bedauerlich.“'] } };
const SP_KINO_DREIER = { k1h: 1, k2a: 1, k2b: 1, k3kuh: 1, k3blinzeln: 1 };
const SP_KINO_TRAUER = { k1h: 'hilde_strahl', k2b: 'tank' };
const SP_TRAUER = ['hilde_strahl', 'tank', 'peter_tod', 'echter_luke', 'mamas_kerze']; // Sperrliste (85 §10, AP-26)
// A-25: erzählende Angst-Untertitel → nur im Barrierefrei-Modus als Geräuschangabe (null = ganz weg)
const SP_ANGST_UT = [[/^Hinter dir: Schritte auf dem Beton/, 'Schritte hinter dir · Lachen'], [/^Hinter dir: nackte Füße/, 'nackte Füße auf Asphalt, viele, hinter dir'],
  [/^Irgendwo hinter dir: ein Kichern/, 'Kichern, leise, hinter dir'], [/^Das Kichern entfernt sich/, 'Kichern, entfernt sich'], [/^Kleine, kalte Finger an deinem Hals/, 'Berührung am Hals'],
  [/^Hinter dir: ein Platschen/, 'Platschen · nasse Schritte hinter dir'], [/^Draußen, vor der Stalltür: ein Kichern/, 'Kichern vor der Stalltür · kleine Schritte'],
  [/^Zwei Atemzüge\. Dann ein dritter/, 'Atmen · ein dritter Atemzug'], [/^Hinter dir\. Ein Atem\./, 'Atem hinter dir'], [/^Sie sucht\. Wie beim Verstecken/, 'kleine Schritte, suchend'],
  [/^Sie spielt\. Sie will nicht/, null]];
const SP_PRAESENZ = { 1: [150, 240], 2: [90, 180], 3: [90, 180], 4: [90, 180], 5: [90, 180], 6: [90, 180] }; // 5.3: Abstand je Kapitel (s)
MOD_SAVE.push(['spannung', () => ({ st: SP.stK, safe: SP.safeK, leer: SP.leerK, fibel: SP.fibelK, sl: SP.sl }),
  v => { if (!v || typeof v !== 'object') return; for (const [k, o] of [['st', SP.stK], ['safe', SP.safeK], ['leer', SP.leerK], ['fibel', SP.fibelK], ['sl', SP.sl]]) if (v[k] && typeof v[k] === 'object') Object.assign(o, v[k]); }]);

function spannung_chapter() { return typeof kap === 'function' ? kap() : ch3.on ? 3 : state.ch2 ? 2 : typeof anwesen_S !== 'undefined' && anwesen_S.ch4 ? 4 : 1; } // 5.8: eine Quelle (kapitel.js)
function sp_kino() { return typeof kino_S !== 'undefined' && kino_S.on; }
function sp_log(name, cls) { SP.log.push([Math.round(SP.t), name, cls]); if (SP.log.length > 80) SP.log.shift(); }
function sp_fwd() { try { return flatDir(); } catch (e) { return { x: 0, z: -1 }; } }
// Spannung 0…1 (5.2): der Stress des Spielers; die Verfolgung zählt immer voll
function spannung_k() { return Math.max(SP.stress, SP.chase ? 1 : 0); }
function spannung_place() { const P = player.pos; if (!state.inBasement && typeof indoorRect === 'function' && indoorRect()) return 'innen';
  if (typeof tief_in === 'function' && tief_in(P.x, P.z)) return 'tief'; return typeof klang_S !== 'undefined' ? klang_S.area : 'ort'; }
function spannung_since(what) { return what === 'peak' ? SP.t - SP.peak : what === 'minor' ? SP.t - SP.lastMinor : what === 'major' ? SP.t - SP.lastMajor : SP.t - (SP.fam[what] ?? -1e9); }
function spannung_silent() { return SP.silent > .5; }
function spannung_hushed() { return SP.t < SP.hushUntil; }
// 5.1 Phasen: ohne Argument die aktuelle Phase; mit n meldet ein Skript Unbehagen (1) oder Präsenz (2) für sek Sekunden
function spannung_phase(n, grund = '', sek = 90) {
  if (n !== undefined) { SP.phaseMan = n; SP.phaseBis = SP.t + sek; sp_log(grund || 'phase' + n, 'phase'); return n; }
  if (sp_kino() || (typeof scripted !== 'undefined' && scripted)) return 4;
  if (SP.chase) return 3;
  if (SP.t - SP.peak < 60 || SP.t - SP.peak3 < 120) return 5;
  return SP.t < SP.phaseBis ? SP.phaseMan : 0;
}
// 5.7: mehr als vier Ereignisse derselben Familie in zehn Minuten → Abstand ×1,8
function sp_gap(fam) { const g = SP_GAP[fam] ?? 30, L = SP.famT[fam]; if (!L) return g; let n = 0; for (const x of L) if (SP.t - x < 600) n++; return n > 4 ? g * 1.8 : g; }
function spannung_can(fam, cls = 'amb', o) {
  const t = SP.t; if (t < SP.hushUntil) return false; // plötzliche Stille: alles hält den Atem an
  if (SP.silent > .5 && fam !== 'gust') return false; // stille Zone
  if (state.talking || state.ending || (typeof ui !== 'undefined' && ui.overlay) || (typeof menu !== 'undefined' && menu.attract) || sp_kino()) return false;
  const ph = spannung_phase(); if (ph === 3 && cls !== 'fear') return false; // Jagd: nur Jäger und Atem
  if (t - (SP.fam[fam] ?? -1e9) < sp_gap(fam)) return false; // Gedächtnis
  if (o && o.behind && (t - SP.peak < 90 || t - SP.umdrehT < 30)) return false; // der Spieler dreht sich gerade noch um – oder ständig: dann vor ihm, nicht hinter ihm
  if (cls === 'amb') {
    if (t - SP.lastAmb < 5 || t - SP.peak < 12 || (fam === SP.lastFam && t - SP.lastAmb < 45)) return false;
    const cap = Math.round((SP_AMB[spannung_place()] ?? 3) * (1 - .5 * spannung_k()) * (ph === 1 ? .7 : 1)); let n = 0; for (const x of SP.amb) if (t - x < 60) n++; return n < cap; }
  if (cls === 'fear') return t - SP.peak > 20;
  if (t - SP.peak < 60 || t - SP.peak3 < 120) return false; // Pflicht-Ruhe (Nachklang: Stufe 2 → 60 s, Stufe 3 → 120 s)
  if (typeof scripted !== 'undefined' && scripted) return false;
  if (spannung_traurig()) return false; // traurige Szenen: kein Schreck
  const gap = (SP_GAPKAP[spannung_chapter()] ?? 60) - 30 * spannung_k(); // je Kapitel dichter, bei Angst etwas öfter
  if (cls === 'minor') return t >= SP.minorSperre && t - Math.max(SP.lastMinor, SP.lastMajor) > gap;
  if (ph === 1 || (ph === 2 && !(o && o.weit))) return false; // Unbehagen: kein Major · Präsenz: nur ferne Sichtung
  if (SP.atem.offen && SP.atem.stufe === 3) return false; // nie zwei Dreier ohne Atempause
  return t - SP.lastMajor > gap + 30 && t - SP.lastMinor > 25; // major
}
function spannung_did(fam, cls = 'amb') {
  const t = SP.t; SP.fam[fam] = t; SP.n.ok++; SP.log.push([Math.round(t), fam, cls]); if (SP.log.length > 80) SP.log.shift();
  const L = SP.famT[fam] || (SP.famT[fam] = []); L.push(t); if (L.length > 6) L.shift();
  if (cls === 'amb') { SP.amb.push(t); if (SP.amb.length > 24) SP.amb.shift(); SP.lastAmb = t; SP.lastFam = fam; }
  else if (cls === 'minor') SP.lastMinor = t; else if (cls === 'major') SP.lastMajor = t;
  if (fam === 'beob' && !SP.a12 && spannung_chapter() >= 3) { SP.a12 = 1; setTimeout(() => { if (!spannung_traurig() && !state.talking && typeof gedanken_atem === 'function') gedanken_atem('beob'); }, 4000); } // A-12
}
function spannung_ask(fam, cls = 'amb', o) { if (spannung_can(fam, cls, o)) { spannung_did(fam, cls); return true; } SP.n.no++; return false; }

// ---------------------------------------------------------------- Stufen, Dreier, Atempausen (5.6, 85 §10, A-28)
function spannung_schreck(stufe, id = '') {
  const t = SP.t; sp_log(id || 'stufe' + stufe, 'stufe' + stufe);
  if (stufe >= 2) { SP.peak = t; if (typeof nat !== 'undefined') nat.calm = Math.max(nat.calm, 30); } // Höhepunkt: Musik schweigt, Natur hält sich zurück, Beobachter 2–3 min still
  if (stufe >= 3) { const k = spannung_chapter();
    if (t - SP.lastDreier >= 45) { const ok = SP.pauseSeit || SP.dreierKap !== k; SP.dreier.push([Math.round(t), id, k, ok ? 1 : 0]); if (SP.dreier.length > 40) SP.dreier.shift();
      if (!ok) SP.verstoss.push(id + '@' + Math.round(t)); SP.pauseSeit = false; } // innerhalb von 45 s: dieselbe Sequenz (Kap. 5 Atem + Polaroid)
    SP.lastDreier = t; SP.peak3 = t; SP.dreierKap = k; }
  if (stufe >= 2) sp_atemAuf(stufe, id);
}
function spannung_dreier(id) { spannung_schreck(3, id || 'dreier'); }
function spannung_peak() { const k5 = spannung_chapter() === 5 && !SP.k5Polaroid; if (k5) SP.k5Polaroid = 1; spannung_schreck(3, k5 ? 'polaroid' : 'peak'); } // Skript-Höhepunkt (Kap. 5: Runde drei)
function spannung_mark(was) { spannung_schreck(was === 'peak3' ? 3 : was === 'welt1' ? 1 : 2, was); } // ältere Aufrufe aus Kapitelmodulen
function sp_atemAuf(stufe, anlass) {
  const A = SP.atem; if (A.offen && A.stufe > stufe) return; // die Dreier-Pause hat Vorrang
  const r = Math.random(); A.anlass = anlass && anlass !== 'scare' ? anlass : A.offen ? A.anlass : ''; A.offen = true; A.stufe = stufe; A.at = SP.t; A.ruhe = 0;
  A.art = spannung_traurig() ? 'still' : stufe >= 3 ? (r < .5 ? 'lacher' : r < .8 ? 'still' : 'riss') : (r < .5 ? 'lacher' : 'still');
}
function sp_atemZu(art, id) { SP.atem.offen = false; SP.pauseSeit = true; sp_log(id || art, 'atem'); }
function spannung_pause(id) { if (SP.atem.offen) sp_atemZu('skript', id); else { SP.pauseSeit = true; sp_log(id || 'skript', 'atem'); } } // geskriptete Atempause (Tabelle 5.6, Slapstick)
function sp_atemTick(el) {
  const A = SP.atem; if (!A.offen) return;
  if (SP.t - A.at > 300) return sp_atemZu('verfallen');
  const ruhig = !state.talking && !sp_kino() && !(typeof ui !== 'undefined' && ui.overlay) && !SP.chase && !state.ending && !(typeof scripted !== 'undefined' && scripted);
  if (ruhig) A.ruhe += el;
  if (spannung_traurig()) A.art = 'still'; // dort bleibt Luke still
  if (A.art === 'lacher' && A.ruhe >= 6) { if (typeof gedanken_atem === 'function' && gedanken_atem(A.anlass)) sp_atemZu('lacher'); else A.art = 'still'; }
  else if (A.art === 'still' && A.ruhe >= 20) sp_atemZu('still');
  else if (A.art === 'riss' && A.ruhe >= 25) { sp_riss(); sp_atemZu('riss'); }
}
// „Ruhe mit Riss“: die Pause ist fast vorbei, dann eine kleine Stufe-1-Anomalie (ein Dielenknarren drinnen, ein dumpfer Schlag draußen, seitlich hinter Luke)
function sp_riss() { const P = player.pos, f = sp_fwd(), s = Math.random() < .5 ? 1 : -1, d = rand(9, 13), x = P.x - f.z * s * d * .8 - f.x * d * .6, z = P.z + f.x * s * d * .8 - f.z * d * .6;
  if (state.inBasement || spannung_place() === 'innen') Audio.play('woodCrack', { gain: .1, rate: 1.5, lp: 1100, x, y: P.y + .3, z, ref: 2 }); else Audio.thump(x, .3, z);
  SP.fam.riss = SP.t; sp_log('riss', 'stufe1'); }
// Gedanken-Sperre: Story-Gedanken (prio 3) immer; sonst nicht bei Stress > 0,7 und nicht in einer stillen Atempause
function spannung_gedankenOk(prio) { if (prio >= 3) return true; if (SP.stress > .7) return false; return !(SP.atem.offen && SP.atem.art === 'still'); }

// ---------------------------------------------------------------- traurige Szenen (Sperrliste)
function spannung_traurig() { return SP.sadHold.size > 0 || SP.t < SP.sad; }
function spannung_trauer(id, sek = 90) { SP.sad = Math.max(SP.sad, SP.t + sek); SP.sadId = id; if (SP.atem.offen) SP.atem.art = 'still'; sp_log(id, 'trauer'); }
function spannung_trauerAn(id) { SP.sadHold.add(id); SP.sadId = id; if (SP.atem.offen) SP.atem.art = 'still'; sp_log(id, 'trauer'); }
function spannung_trauerAus(id, nach = 60) { SP.sadHold.delete(id); spannung_trauer(id, nach); }
const sp_vorher = (o, fn) => function () { try { fn(); } catch (e) {} return o.apply(this, arguments); };
const sp_waehrend = (o, id, nach) => async function () { spannung_trauerAn(id); try { return await o.apply(this, arguments); } finally { spannung_trauerAus(id, nach); } };

// ---------------------------------------------------------------- Stille, Ton-Abriss, Stinger-Diät (A-26/5.9)
// Plötzliche Stille: alle Planer pausieren, Regen und Wind sinken auf lvl (Standard 0,2); lvl < 0,05 ist ein Ton-Abriss
function spannung_hush(sec, lvl = .2) { SP.hushLvl = SP.t < SP.hushUntil ? Math.min(SP.hushLvl, lvl) : lvl; SP.hushUntil = Math.max(SP.hushUntil, SP.t + sec); spannung_bed(true); }
function spannung_bed(now) {
  const A = Audio; if (!A.ctx || !A.hushG) return; const want = SP.t < SP.hushUntil ? SP.hushLvl : 1 - .8 * SP.silent;
  if (!now && Math.abs(want - SP.hushV) < .01) return; const down = want < SP.hushV; SP.hushV = want; A.hushG.gain.setTargetAtTime(want, A.ctx.currentTime, down ? (want < .05 ? .03 : .12) : 1.4);
}
function sp_abriss() { SP.n.abriss++; spannung_hush(.4, .02); }
function sp_atemNah() { const P = player.pos, f = sp_fwd(), x = P.x - f.x * .5, z = P.z - f.z * .5; // Atem am Ohr statt Schrei
  try { if (typeof kino_atem === 'function') kino_atem(.08, .8, x, P.y + 1.6, z); else Audio.whisper(x, P.y + 1.6, z, .9); } catch (e) {} }
// Die Regie hört mit: Schreckklänge sind Stufe 2, große Stinger Stufe 3, die Verfolgungsmusik hebt die Spannung (Jagd)
{ const sc = Audio.scareSound, st = Audio.stinger, ch = Audio.chaseMusic;
  Audio.scareSound = function (k) {
    if (sp_kino()) { SP.peak = SP.t; return sc.call(this, k); } // Kinosequenzen sind ausgenommen
    if (k === 'scream') { sp_abriss(); sp_atemNah(); spannung_schreck(2, 'kein_schrei'); return; } // 02 H4: Luna schreit nie
    if (k === 'violin' || k === 'screech') { const c = spannung_chapter(); if (SP.stK[c]) { sp_abriss(); spannung_schreck(2, 'abriss_' + k); return; } SP.stK[c] = 1; }
    spannung_schreck(2, 'sc_' + k); return sc.call(this, k); };
  Audio.stinger = function (big) { if (big) { if (sp_kino()) SP.peak = SP.t; else spannung_schreck(3, 'stinger'); } return st.call(this, big); };
  Audio.chaseMusic = function (on) { SP.chase = !!on; return ch.call(this, on); }; }
// A-25: Angst-Untertitel ohne Sprecher werden nicht mehr erzählt; im Barrierefrei-Modus als Geräuschangabe
function sp_geraeuscheAn() { try { return !!settings.geraeusche; } catch (e) { return false; } }
function spannung_geraeusch(t, ms = 3000) { if (sp_geraeuscheAn()) subtitle('[' + t + ']', ms); }
subtitle = (o => function (t, ms, who) {
  if (!who && typeof t === 'string') { const p = t.replace(/<[^>]*>/g, ''); for (const [re, cap] of SP_ANGST_UT) if (re.test(p)) { if (cap && sp_geraeuscheAn()) return o.call(this, '[' + cap + ']', Math.min(ms || 3000, 3000)); return; } }
  return o.apply(this, arguments); })(subtitle);

// ---------------------------------------------------------------- 5.2 Stress · 5.6 Spielerverhalten
function sp_bewegung(el) {
  const P = player.pos, t = SP.t; if (SP.px !== null && el > 0) SP.speed = Math.hypot(P.x - SP.px, P.z - SP.pz) / el; SP.px = P.x; SP.pz = P.z;
  SP.laerm = Math.max(SP.speed > 4.2 ? 18 : SP.speed > .6 ? 6 : 2, t < SP.laermBis ? SP.laermX : 0);
  const y = player.yaw; if (SP.yaw !== null) { const d = y - SP.yaw; SP.drehAcc += Math.abs(Math.atan2(Math.sin(d), Math.cos(d))); } SP.yaw = y; // Umdrehen: > 120° in höchstens 2 s
  SP.drehT += el; if (SP.drehT > 2) { SP.drehT = 0; SP.drehAcc = 0; }
  if (SP.drehAcc > 2.09) { SP.drehAcc = 0; SP.drehT = 0; SP.dreh[SP.drehI] = t; SP.drehI = (SP.drehI + 1) & 3; if (t - SP.dreh[SP.drehI] < 10) SP.umdrehT = t; } // vier in 10 s
}
function spannung_laerm(r, sek = 2) { if (r !== undefined) { SP.laermX = r; SP.laermBis = SP.t + sek; } return Math.max(SP.laerm, SP.t < SP.laermBis ? SP.laermX : 0); } // Pfandflasche 25, Rufen 35
function spannung_sicht() { return typeof flashOn !== 'undefined' && flashOn && FLASH.charge > 0 ? 30 : 8; }
function sp_stress(el) {
  const t = SP.t, P = player.pos; let near = SP.chase ? .8 : 0;
  if (typeof hunt !== 'undefined' && hunt.on && typeof grey !== 'undefined' && grey.visible) near = Math.max(near, 1 - Math.hypot(grey.position.x - P.x, grey.position.z - P.z) / 25);
  const dunkel = typeof fear !== 'undefined' ? Math.min(1, fear.v / .55) : 0, schwach = typeof FLASH !== 'undefined' && FLASH.charge < FLASH.LOW ? 1 : 0;
  const S = Math.min(1, .35 * dunkel + .25 * Math.max(0, near) + .2 * Math.exp(-(t - SP.peak) / 40) + .1 * (SP.speed > 4.2 ? 1 : 0) + .1 * schwach); SP.stress = S;
  SP.lowT = S < .25 ? SP.lowT + el : 0; if (SP.lowT > 120) { SP.praesFrei = true; SP.lowT = 0; } // lange ruhig → Präsenz frei (Left-4-Dead-Prinzip)
  SP.highT = S > .75 ? SP.highT + el : 0; if (SP.highT > 20) { SP.minorSperre = t + 45; SP.highT = 0; } // lange hoch → 45 s nichts Neues
}
// Lesen > 20 s: beim Schließen mit 30 % ein Knarren hinter Luke · Fibel: einmal je Kapitel
function sp_hinterDir(fam) { setTimeout(() => { if (!state.started || !spannung_ask(fam, 'minor', { behind: true })) return; const P = player.pos, f = sp_fwd();
  Audio.play('woodCrack', { gain: .11, rate: 1.7, lp: 1200, x: P.x - f.x * 3, y: P.y + .2, z: P.z - f.z * 3, ref: 2 }); }, 1400); }
function sp_overlay(el) { const ov = (typeof ui !== 'undefined' && ui.overlay) || '';
  if (ov !== SP.ovId) { const k = spannung_chapter(); if (SP.ovId === 'note' && SP.ovT > 20 && Math.random() < .3) sp_hinterDir('lesen');
    if (SP.ovId === 'journal' && SP.ovT > 3 && !SP.fibelK[k]) { SP.fibelK[k] = 1; sp_hinterDir('fibel'); } SP.ovId = ov; SP.ovT = 0; } else if (ov) SP.ovT += el; }

// ---------------------------------------------------------------- 5.3 Präsenz ohne Kontakt · 5.4 falsche Sicherheit · 5.5 leere Stille
function sp_ruhig() { return !state.talking && !(typeof ui !== 'undefined' && ui.overlay) && !sp_kino() && !SP.chase && !spannung_traurig() && !state.ending; }
function sp_praesenz(el) {
  SP.praesT -= el; if (SP.praesT > 0 && !SP.praesFrei) return; const k = spannung_chapter(), G = SP_PRAESENZ[k]; if (!G) return;
  if (!sp_ruhig() || SP.t - SP.peak < 90 || SP.silent > .3) { SP.praesT = 15; return; }
  if (!spannung_ask('praesenz', 'minor')) { SP.praesT = 20; return; }
  SP.praesFrei = false; SP.praesT = rand(G[0], G[1]);
  const P = player.pos, f = sp_fwd(), s = Math.random() < .5 ? 1 : -1, a = (SP.t - SP.umdrehT > 30 && Math.random() < .3 ? rand(150, 200) : rand(60, 110)) * s * PI / 180;
  const c = Math.cos(a), si = Math.sin(a), dx = f.x * c - f.z * si, dz = f.x * si + f.z * c, at = d => [P.x + dx * d, P.z + dz * d], place = spannung_place();
  let p, wer = '';
  if (k === 1 && !state.inBasement && place !== 'innen') { p = at(rand(28, 40)); Audio.play('metalHit2', { gain: .16, rate: .78, lp: 900, x: p[0], y: 1, z: p[1], ref: 6 }); wer = 'kombi'; } // eine Autotür, fern
  else if (k === 2) { p = at(rand(12, 16)); Audio.thump(p[0], P.y + 2.4, p[1]); wer = 'k1'; } // hinter der Wand, über der Decke
  else if ((k === 3 && ch3.on && ch3.part === 'town') || (k === 5 && place !== 'innen' && !state.inBasement)) { if (typeof hunt !== 'undefined' && hunt.on) return; p = at(rand(14, 18)); Audio.giggle(p[0], 1, p[1]); wer = 'graukind'; }
  else if (k === 4 && !state.inBasement && place !== 'innen') { p = at(rand(18, 24)); Audio.chains(p[0], 1.2, p[1]); wer = 'blechmann'; }
  else if (k === 6 && (place === 'wald' || place === 'tief')) { spannung_hush(rand(4, 6), .1); wer = 'wendigo'; } // wandernde Stille
  if (wer) sp_log('praesenz_' + wer, 'praesenz');
}
function spannung_safe(zone, an = true) { SP.safeZone = an ? zone || 'skript' : ''; }
function sp_sicher(el) { const k = spannung_chapter(); if (SP.safeK[k]) return;
  const drin = !!SP.safeZone || (!state.inBasement && spannung_place() === 'innen');
  SP.safeT = drin && sp_ruhig() && SP.t - SP.peak > 90 && SP.stress < .5 ? SP.safeT + el : 0; if (!SP.safeZiel) SP.safeZiel = rand(40, 70);
  if (SP.safeT < SP.safeZiel) return; SP.safeK[k] = 1; SP.safeT = 0; SP.safeZiel = 0;
  const P = player.pos, f = sp_fwd(); Audio.play('woodCrack', { gain: .13, rate: 1.3, lp: 1000, x: P.x - f.x * 2.5, y: P.y + 2.7, z: P.z - f.z * 2.5, ref: 2 }); // ein Schritt oben
  spannung_did('sicher', 'minor'); sp_log('falsche_sicherheit', 'stufe1'); }
function sp_leer(el) { const k = spannung_chapter(), n = SP.leerK[k] || 0; if (n >= 2 || SP.t - SP.leerT < 600) return;
  const ok = sp_ruhig() && SP.stress < .4 && SP.silent < .1 && !state.inBasement && spannung_place() !== 'innen' && SP.t - Math.max(SP.peak, SP.lastMinor, SP.lastMajor) > 180;
  SP.leerRuhe = ok ? SP.leerRuhe + el : 0; if (SP.leerRuhe < 60) return;
  SP.leerRuhe = 0; SP.leerK[k] = n + 1; SP.leerT = SP.t; spannung_hush(rand(8, 12), .05); sp_log('leere_stille', 'stille'); }

// ---------------------------------------------------------------- Erkennen: Kino-Dreier, Trauer, Schreckzähler, Stille-Zone (A-23)
function sp_erkennen() {
  const kid = sp_kino() ? kino_S.id || '' : '';
  if (kid !== SP.kinoId) { const alt = SP.kinoId;
    if (alt && SP_KINO_TRAUER[alt]) spannung_trauerAus(SP_KINO_TRAUER[alt], 90);
    if (alt && SP_KINO_DREIER[alt]) { SP.peak = SP.peak3 = SP.t; } // nach dem Film: Nachklang und Beobachter-Schweigen ab jetzt
    if (kid) { if (SP_KINO_TRAUER[kid]) spannung_trauerAn(SP_KINO_TRAUER[kid]); if (SP_KINO_DREIER[kid]) spannung_dreier(kid); }
    SP.kinoId = kid; }
  if (typeof feuer_S !== 'undefined' && feuer_S.zs) { const nick = feuer_S.zs.st === 'nick'; if (nick && !SP.peterNick) spannung_trauer('peter_tod', 150); SP.peterNick = nick; } // Peter nickt im Öl
  if (typeof scareCount !== 'undefined') { if (SP.scares < 0) SP.scares = scareCount; else if (scareCount !== SP.scares) { const neu = scareCount > SP.scares; SP.scares = scareCount; if (neu) sp_atemAuf(2, 'scare'); } }
  if (SP.silent > .5) SP.warStill = true;
  else if (SP.warStill && SP.silent < .1) { SP.warStill = false; if (!SP.a23 && spannung_chapter() === 6) { SP.a23 = 1; setTimeout(() => { if (!spannung_traurig() && typeof gedanken_atem === 'function') gedanken_atem('stillezone'); }, 2500); } }
}

// ---------------------------------------------------------------- Slapstick S-08 „Montag!“ (85 §11; Kap. 1 nach W-03, nicht im Umfeld der elf Anrufe)
function sp_slapstick() {
  if (SP.sl['S-08'] || spannung_chapter() !== 1 || typeof whiskey_S === 'undefined' || !whiskey_S.ready || !whiskey_S.g) return;
  if (whiskey_S.hatSchluessel) { SP.w03T = -1; return; } if (SP.w03T < 0) { SP.w03T = SP.t; return; }
  if (SP.t - SP.w03T < 150 || !whiskey_S.g.visible || !sp_ruhig() || SP.t - SP.peak < 90 || state.inBasement || spannung_place() === 'innen') return;
  const g = whiskey_S.g.position, P = player.pos; if (Math.hypot(g.x - P.x, g.z - P.z) > 14) return;
  SP.sl['S-08'] = 1; sp_montag().catch(e => console.warn('Slapstick S-08', e));
}
async function sp_montag() { state.talking = true;
  try {
    whiskey_mimic('klingelton', { force: true }); await wait(3200); whiskey_mimic('klingelton', { force: true }); await wait(3600); // zweimal greift Luke zur Tasche
    if (Audio.ring) Audio.ring(.3); await wait(1500); if (Audio.ring) Audio.ring(.3); await wait(1400); // diesmal klingelt wirklich das Handy
    await say([['„… und Montag ist das fertig.“', 2600, 'CHEF (AM TELEFON)'], ['„Ich bin … auf dem Land. Familiensache.“', 3200, 'DU']]);
    await wait(900); whiskey_mimic('montag', { force: true }); await wait(1900);
    await say([['„Du nicht auch noch.“', 2200, 'DU']]);
  } finally { state.talking = false; spannung_pause('S-08'); }
}

// ---------------------------------------------------------------- Einstellungen: „Geräusche als Untertitel“ (A-25, Wunsch aus AP-21)
function sp_einstellung() { try { const P = document.getElementById('subPanel'), z = P && P.querySelector(':scope > div.close'); if (!z || !P.querySelector('#sGfx') || document.getElementById('sGer')) return;
  z.insertAdjacentHTML('beforebegin', `<div class="row"><span>Geräusche als Untertitel (Barrierefrei)</span><input type="checkbox" id="sGer" ${settings.geraeusche ? 'checked' : ''}></div>`);
  const c = document.getElementById('sGer'); c.onclick = ev => ev.stopPropagation(); c.onchange = ev => { settings.geraeusche = ev.target.checked; saveSettings(); }; } catch (e) {} }

WORLD_MODS.push(['Spannung', async () => { // Eintrag für die Messanzeige
  try { if (settings.geraeusche === undefined) settings.geraeusche = false; } catch (e) {}
  const mS = document.getElementById('mSet'); if (mS) mS.addEventListener('click', () => setTimeout(sp_einstellung, 0));
  // Dreier, die kein Kino sind: die Funktionen der Kapitelmodule melden sich beim Aufruf (Name bleibt, nur umhüllt)
  if (typeof kapitel1_nichtDu === 'function') kapitel1_nichtDu = sp_vorher(kapitel1_nichtDu, () => spannung_dreier('k1_nichtdu'));
  if (typeof kapitel1_danke === 'function') kapitel1_danke = sp_vorher(kapitel1_danke, () => spannung_dreier('k1_danke'));
  if (typeof spiderEvent === 'function') spiderEvent = sp_vorher(spiderEvent, () => spannung_dreier('k2_spinnen'));
  if (typeof villa_hoehepunktA === 'function') villa_hoehepunktA = sp_vorher(villa_hoehepunktA, () => spannung_dreier('k4_glas'));
  if (typeof villa_hoehepunktB === 'function') villa_hoehepunktB = sp_vorher(villa_hoehepunktB, () => spannung_dreier('k4_hand'));
  if (typeof k5_augenAuf === 'function') k5_augenAuf = sp_vorher(k5_augenAuf, () => spannung_dreier('k5_augenauf'));
  if (typeof k6_ag20 === 'function') k6_ag20 = sp_vorher(k6_ag20, () => spannung_dreier('k6_ag20'));
  if (typeof hungrige_finale === 'function') hungrige_finale = sp_vorher(hungrige_finale, () => spannung_dreier('k6_raben'));
  // traurige Szenen, die kein Kino sind
  if (typeof k5_stallSzene === 'function') k5_stallSzene = sp_waehrend(k5_stallSzene, 'echter_luke', 90);
  if (typeof k6_hochsitz === 'function') k6_hochsitz = sp_waehrend(k6_hochsitz, 'echter_luke', 90);
  if (typeof k5_kerzeAnzuenden === 'function') k5_kerzeAnzuenden = sp_waehrend(k5_kerzeAnzuenden, 'mamas_kerze', 90);
  if (typeof CH2_END !== 'undefined') CH2_END.push(() => spannung_trauer('tank', 120));
  // S-08: Whiskey macht den Chef nach (Nachahmung, kein eigener Satz)
  if (typeof WHISKEY_MIMIC !== 'undefined' && !WHISKEY_MIMIC.montag) { WHISKEY_MIMIC.montag = { v: 'chef', t: 'Montag!' }; if (typeof WHISKEY_STIMMEN !== 'undefined') WHISKEY_STIMMEN.chef = 'WHISKEY (MIT DER STIMME DEINES CHEFS)'; }
}]);
WORLD_TICK.push(dt => {
  SP.t += dt; SP.el += dt; SP.tick -= dt; if (SP.tick > 0) return; SP.tick = .25; const el = SP.el; SP.el = 0;
  // stille Zonen: Fraßstelle und Bau der Hungrigen – je näher, desto stiller (ab 35 m, ganz still ab 25 m)
  let s = 0; if (typeof HUNGRIGE !== 'undefined' && !state.inBasement && state.zone !== 'canal') { const P = player.pos, d = Math.min(Math.hypot(P.x - HUNGRIGE.spuren.x, P.z - HUNGRIGE.spuren.z), Math.hypot(P.x - HUNGRIGE.bau.x, P.z - HUNGRIGE.bau.z)); s = d < 25 ? 1 : d < 35 ? (35 - d) / 10 : 0; }
  SP.silent = s; spannung_bed(false);
  if (!state.started || (typeof menu !== 'undefined' && menu.attract)) return;
  sp_bewegung(el); sp_stress(el); sp_erkennen(); sp_atemTick(el); sp_overlay(el);
  SP.sek -= el; if (SP.sek > 0) return; SP.sek = 1; sp_praesenz(1); sp_sicher(1); sp_leer(1); sp_slapstick();
});
window.__spannung = { S: SP, can: spannung_can, ask: spannung_ask, hush: spannung_hush, peak: spannung_peak, k: spannung_k, place: spannung_place,
  schreck: spannung_schreck, dreier: spannung_dreier, pause: spannung_pause, traurig: spannung_traurig, trauer: spannung_trauer, phase: spannung_phase, budget: SP_BUDGET, sperrliste: SP_TRAUER,
  dev: { ut: (t, w) => subtitle(t, 1500, w), blick: (a, s) => typeof gedanken_blick === 'function' ? gedanken_blick(a, s) : null, atem: a => typeof gedanken_atem === 'function' ? gedanken_atem(a) : null },
  pruefe: () => ({ dreier: SP.dreier.map(e => e.join(':')), verstoss: SP.verstoss.slice(), atem: SP.log.filter(e => e[2] === 'atem').map(e => e.join(':')), stinger: Object.assign({}, SP.stK), abriss: SP.n.abriss }),
  stats: () => ({ ok: SP.n.ok, no: SP.n.no, log: SP.log.slice(-14).map(e => e.join(':')).join(' '), silent: SP.silent, hush: SP.t < SP.hushUntil, k: Math.round(spannung_k() * 100) / 100, phase: spannung_phase(),
    atem: SP.atem.offen ? SP.atem.art + '/' + SP.atem.stufe : '-', traurig: spannung_traurig(), laerm: SP.laerm, room: Audio.room, mus: Audio.musicState && Audio.musicState() }) }; // Testzugriff
