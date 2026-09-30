// =====================================================================  SPANNUNG (Modul „spannung“): die Regie über alle Geräusch- und Schreck-Planer
// Kein Planer löst mehr auf eigene Faust aus. Vorher: spannung_ask(Familie, Klasse) – oder spannung_can(...) prüfen und nach Erfolg spannung_did(...) melden.
// Klassen: amb (Umgebung: Tiere, Holz, Wasser, Rohre …) · fear (Angst-Flüstern) · minor (Unerklärliches: Schritte, Kichern, Ketten, Stille …) · major (Gestalten, feste Schreckmomente).
// Regeln: Budget je Minute nach Ort und Spannung (je höher die Spannung, desto stiller die Natur) · Mindestabstand je Familie (Gedächtnis, nie dieselbe Familie
// zweimal hintereinander) · Pflicht-Ruhe nach jedem Höhepunkt (Schreckklang/großer Stinger) · in Gesprächen/Filmszenen nichts · Aufmerksamkeit: nichts „hinter dir“
// kurz nach einem Schreck · plötzliche Stille (spannung_hush) hält alle Planer an und senkt Regen/Wind auf 0,2 · stille Zonen an Fraßstelle und Bau der Hungrigen
// (25 m): alles verstummt bis auf hohen Wind in den Kronen, kein Nachhall – „der Wald hat kein Echo“.
const SP = { t: 0, amb: [], lastAmb: -99, lastFam: '', fam: {}, lastMinor: 0, lastMajor: 0, peak: -999, hushUntil: 0, silent: 0, hushV: 1, chase: false, tick: 0, n: { ok: 0, no: 0 }, log: [] }; // lastMinor/lastMajor 0: zu Beginn erst ankommen lassen
// Mindestabstand je Familie (s) – was fehlt, gilt 30 s
const SP_GAP = { owl: 75, fox: 200, deer: 120, crow: 60, twig: 14, rustle: 10, critter: 25, branch: 70, treeCreak: 30, flap: 40, drip: 4, gutter: 35, bark: 100, train: 420, howl: 240,
  gust: 12, creak: 22, settle: 15, pipe: 40, water: 45, window: 30, outside: 45, metal: 30, vent: 40, buzz: 50, door: 90, above: 150, upstairs: 150, fern: 30, grunt: 25,
  whisper: 35, steps: 150, giggle: 900, chains: 300, knock: 120, figure: 110, shutter: 60, dogcut: 240, car: 300, silence: 200, crows: 160, swing: 180, rats: 90, eyes: 20, lamp: 90, thump: 120, flicker: 60, window_fig: 150, beob: 20 };
// Umgebungsereignisse je Minute nach Ort (bei voller Spannung die Hälfte)
const SP_AMB = { wald: 3, tief: 2, ort: 2, friedhof: 2, villa: 2, innen: 2, keller: 3, amt: 3, kanal: 3, weiss: 0 }; // Betten tragen die Kulisse – Einzelereignisse sparsam
function spannung_chapter() { return ch3.on ? 3 : state.ch2 ? 2 : typeof anwesen_S !== 'undefined' && anwesen_S.ch4 ? 4 : 1; }
// Spannung 0…1: Angst, Verfolgung, Nachklang des letzten Schrecks
function spannung_k() { return Math.min(1, Math.max(typeof fear !== 'undefined' ? fear.v : 0, SP.chase ? 1 : 0, Math.exp(-(SP.t - SP.peak) / 40))); }
function spannung_place() { const P = player.pos; if (!state.inBasement && typeof indoorRect === 'function' && indoorRect()) return 'innen';
  if (typeof tief_in === 'function' && tief_in(P.x, P.z)) return 'tief'; return typeof klang_S !== 'undefined' ? klang_S.area : 'ort'; }
function spannung_since(what) { return what === 'peak' ? SP.t - SP.peak : what === 'minor' ? SP.t - SP.lastMinor : what === 'major' ? SP.t - SP.lastMajor : SP.t - (SP.fam[what] ?? -1e9); }
function spannung_silent() { return SP.silent > .5; }
function spannung_hushed() { return SP.t < SP.hushUntil; }
function spannung_can(fam, cls = 'amb', o) {
  const t = SP.t; if (t < SP.hushUntil) return false; // plötzliche Stille: alles hält den Atem an
  if (SP.silent > .5 && fam !== 'gust') return false; // stille Zone
  if (state.talking || state.ending || (typeof ui !== 'undefined' && ui.overlay) || (typeof menu !== 'undefined' && menu.attract)) return false;
  if (t - (SP.fam[fam] ?? -1e9) < (SP_GAP[fam] ?? 30)) return false; // Gedächtnis
  if (o && o.behind && t - SP.peak < 90) return false; // der Spieler dreht sich gerade noch um
  if (cls === 'amb') {
    if (t - SP.lastAmb < 5 || t - SP.peak < 12 || (fam === SP.lastFam && t - SP.lastAmb < 45)) return false;
    const cap = Math.round((SP_AMB[spannung_place()] ?? 3) * (1 - .5 * spannung_k())); let n = 0; for (const x of SP.amb) if (t - x < 60) n++; return n < cap; }
  if (cls === 'fear') return t - SP.peak > 20;
  if (t - SP.peak < 60) return false; // Pflicht-Ruhe nach einem Höhepunkt
  if (typeof scripted !== 'undefined' && scripted) return false;
  const gap = [0, 85, 70, 60, 60][spannung_chapter()] - 30 * spannung_k(); // je Kapitel dichter, bei Angst etwas öfter
  if (cls === 'minor') return t - Math.max(SP.lastMinor, SP.lastMajor) > gap;
  return t - SP.lastMajor > gap + 30 && t - SP.lastMinor > 25; // major
}
function spannung_did(fam, cls = 'amb') {
  const t = SP.t; SP.fam[fam] = t; SP.n.ok++; SP.log.push([Math.round(t), fam, cls]); if (SP.log.length > 80) SP.log.shift();
  if (cls === 'amb') { SP.amb.push(t); if (SP.amb.length > 24) SP.amb.shift(); SP.lastAmb = t; SP.lastFam = fam; }
  else if (cls === 'minor') SP.lastMinor = t; else if (cls === 'major') SP.lastMajor = t;
}
function spannung_ask(fam, cls = 'amb', o) { if (spannung_can(fam, cls, o)) { spannung_did(fam, cls); return true; } SP.n.no++; return false; }
// Höhepunkt (Schreckklang, großer Stinger, Gestalt gesehen): danach Ruhe – die Musik schweigt (MUSIC.after), die Natur hält sich zurück
function spannung_peak() { SP.peak = SP.t; if (typeof nat !== 'undefined') nat.calm = Math.max(nat.calm, 30); }
// Plötzliche Stille: alle Planer pausieren, Regen und Wind sinken auf 0,2
function spannung_hush(sec) { SP.hushUntil = Math.max(SP.hushUntil, SP.t + sec); spannung_bed(true); }
function spannung_bed(now) {
  const A = Audio; if (!A.ctx || !A.hushG) return; const want = SP.t < SP.hushUntil ? .2 : 1 - .8 * SP.silent;
  if (!now && Math.abs(want - SP.hushV) < .01) return; const down = want < SP.hushV; SP.hushV = want; A.hushG.gain.setTargetAtTime(want, A.ctx.currentTime, down ? .12 : 1.4);
}
// Die Regie hört mit: Schreckklänge und große Stinger sind Höhepunkte, die Verfolgungsmusik hebt die Spannung
{ const sc = Audio.scareSound, st = Audio.stinger, ch = Audio.chaseMusic;
  Audio.scareSound = function (k) { spannung_peak(); return sc.call(this, k); };
  Audio.stinger = function (big) { if (big) spannung_peak(); return st.call(this, big); };
  Audio.chaseMusic = function (on) { SP.chase = !!on; return ch.call(this, on); }; }
WORLD_MODS.push(['Spannung', async () => {}]); // Eintrag für die Messanzeige
WORLD_TICK.push(dt => {
  SP.t += dt; SP.tick -= dt; if (SP.tick > 0) return; SP.tick = .25;
  // stille Zonen: Fraßstelle und Bau der Hungrigen – je näher, desto stiller (ab 35 m, ganz still ab 25 m)
  let s = 0; if (typeof HUNGRIGE !== 'undefined' && !state.inBasement && state.zone !== 'canal') { const P = player.pos, d = Math.min(Math.hypot(P.x - HUNGRIGE.spuren.x, P.z - HUNGRIGE.spuren.z), Math.hypot(P.x - HUNGRIGE.bau.x, P.z - HUNGRIGE.bau.z)); s = d < 25 ? 1 : d < 35 ? (35 - d) / 10 : 0; }
  SP.silent = s; spannung_bed(false);
});
window.__spannung = { S: SP, can: spannung_can, ask: spannung_ask, hush: spannung_hush, peak: spannung_peak, k: spannung_k, place: spannung_place,
  stats: () => ({ ok: SP.n.ok, no: SP.n.no, log: SP.log.slice(-14).map(e => e.join(':')).join(' '), silent: SP.silent, hush: SP.t < SP.hushUntil, k: Math.round(spannung_k() * 100) / 100, room: Audio.room, mus: Audio.musicState && Audio.musicState() }) }; // Testzugriff
