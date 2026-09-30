// =====================================================================  DER NEUNTE (Modul „beobachter“, Fassung 3 · AP-07)
// Kanon: story_final.md Kern §7 und Dossier „Der Beobachter (∴)“ (82); 5.2 „Beobachter je Kapitel“. Wer er ist, sagt erst Kapitel 7 – hier steht nur, was er tut.
// Er spricht nie, unterschreibt immer mit ∴ (der Ein-Punkt ist Kapitel 7 vorbehalten: BEOB_SIG1 wird vor Kap. 7 nie benutzt).
// Modi je Kapitel (beob_mode):
//   Kap. 1 „klang“: nie sichtbar · selten zu hören (20–40 s, nie näher als 12 m) · Spuren · zwei Zettel nur per Skript (B-K1-01 Auto, B-K1-02 Kellertür).
//   Kap. 2 „decke“: über der Decke (Kratzen 2 m über Luke und voraus, Klopfen 3-Pause-3, Tropfen hinter ihm) · genau eine Fast-Sichtung (0,8 s, Lüftungsklappe).
//   ab Kap. 3 „voll“: Verstecksystem (steht nie frei, ein Drittel sichtbar hinter Deckung am Bildrand), peekGap [20, 45], Ein-Sekunden-Regel (BEOB.seenMax),
//   mutiger bei Stillstand/Lampe aus, Atmen (höchstens zweimal je Kapitel), Papier/Bleistift/Bonbon, Stille-Regel (45 s), Stille-Fenster (A-29), Gewöhnungsschutz (5.7).
//   „aus“: Nimmerheim, Keller Nr. 7 (Eisen), Flurschleife in Nr. 1 (Kap. 5), ab Kap. 7.
// Sperren (erzwungene Stille, zählt für die Stille-Regel): Wendigo/Stille-Zonen, Graukind nah (ab Kap. 5), Skript (beob_still), BEOB_SPERREN (Wolter/Blechmänner, AP-06).
// Eisen (02 D1): nie direkt neben eisernen Dingen, nie ein Zettel darauf (beob_eisen).
// Gänsehaut-Momente (Q-9): verschobene Dinge, Atem hinter Türen, dreifingrige Abdrücke im Beschlag, Schatten unter Türen, angelehnte Türen – je mit Spannungs-Budget
//   (spannung_can 'beob_gh' minor), nie < 90 s nach einem Höhepunkt, nie in traurigen Szenen, Deckel je Kapitel.
// Schnittstellen für andere Pakete (alle mit typeof prüfen):
//   beobachter_zettel(id, o)   festen Zettel legen: id 'B-K3-01' oder 'b_k3_01'; o = { pos: [x, y, z], vor: true (vor Luke), gitter: true (segelt von der Decke),
//                              variante } → true, wenn gelegt. Jeder Zettel höchstens einmal.
//   beob_sichtung(pos, dauer, o) gesetzte Sichtung (AP-10: Kap. 4 Abspann Treppe, Kap. 6 Wrack/Blitz): Modell an pos ([x, y, z]) für dauer s (≤ 1 s);
//                              o.weg = [[x, y, z], …] läuft den Weg ab (Trippeln), o.blick = [x, y, z], o.ohren (Hände auf den Ohren: Kopf gesenkt). Nie in Kap. 1.
//   beob_pos()                 wo er gerade ist (THREE.Vector3; auch unsichtbar) oder null – Blickziel für Katzen (AP-09), Whiskey (AP-08)
//   beob_spur(art, o)          Spur setzen: 'kratzer' | 'abdruck' | 'beschlag' | 'hand' | 'kiesel' | 'bonbon' (o: pos, ry, n, spiegel, frisch)
//   beob_bonbon(x, y, z)       ein Bonbon klackt gegen Zähne (Kap. 5 Küche Nr. 1)
//   beob_still(sek)            Skript-Stille (z. B. AG-08) · BEOB_SPERREN.push(() => bool) Dauersperre (Wolter in Sicht, Blechmann < 25 m …)
//   beobachter_falle(weg)      Kap. 6: Weg der Falle 'mit' | 'sabotage' | 'ab' → Rückseite von B-K6-06
//   Kap. 5 Fotos (fotos.js-Regel „nur Kreuzungsbild“): kamera_render blendet ihn aus, außer das Ziel setzt Z.beob = true (Kreuzung, „Zuletzt neun“).
// Modell: assets/ms/beobachter/model.glb (ohne Skelett): Haut wie Kerzenwachs mit Licht dahinter, feucht (Klarlack), Augen ganz dunkel und nass,
//   Kopf ruckt statt zu drehen, atmet, Fühler wippen (Shader beob_fuehler); verschwindet zwischen zwei Bildern (kein Ausblenden, kein Gleiten).
const BEOB = { h: .82, gap: [150, 260], sndGap: [8, 20], sndGapK1: [20, 40], k1Min: 12, peekGap: [20, 45], seenMax: 1, stille: 45, nah: 3.5 };
const BEOB_SIG = '<span style="letter-spacing:.34em;margin-left:.2em">∴</span>', BEOB_SIG1 = '<span>.</span>'; // BEOB_SIG1: erst Kapitel 7
const BEOB_SPERREN = []; // weitere Sperren (AP-06: Wolter in Sicht, Blechmann in 25 m) – Funktionen, die true liefern, wenn er schweigen muss
const beob_S = { ready: false, found: new Set(), given: new Set(), bonus: new Set(), done: false, k2seen: false, lit: 0, dyn: new Set(),
  stat: { turns: 0, still: 0, stillMax: 0, flashOff: 0, runs: 0, t: 0, lastYaw: 0, fl: true, run: false, acc: 0 }, a: { x: 0, z: 0 },
  vp: null, vpOk: false, sndT: 8, noteT: 90, peekT: 30, model: null, V: null, peek: null, sicht: null, notes: [], spots: [], falling: [],
  t: 0, kap: 0, c: null, fam: [], lastFam: '', side: 1, quietT: 0, sperrT: 0, sperrWas: false, stillUntil: 0, winUntil: -1, winNext: 300, paperFirst: false,
  lastPeak: null, peakUntil: 0, gh: { t: 45, props: null, propsT: 0, look: 0 }, spuren: [], spurSeen: 0, covers: null, coversKap: 0, eisen: [], chirpT: 0, falle: null,
  k2: null, doorsAjar: [], strip: null, hands: [], wasBasement: false, noteOpenT: 0, lastNoteT: -999, test: { maxVis: 0, vis: 0, k1Model: 0, k2win: [], shown: 0, vanish: 0, snd: {}, gh: [] } };
function beob_cNeu(k) { return { k, lit: 0, off: 0, atem: 0, papierLeer: 0, ganz: false, wins: 0, winsMax: 2 + (Math.random() < .5 ? 1 : 0), gh: 0, vanish: 0, stilleLehr: 0, bleistift: 0, bonbon: 0 }; }
beob_S.c = beob_cNeu(0);
MOD_SAVE.push(['beobachter', () => ({ found: [...beob_S.found], given: [...beob_S.given], bonus: [...beob_S.bonus], done: beob_S.done, k2seen: beob_S.k2seen, lit: beob_S.c.lit, dyn: [...beob_S.dyn],
  c: beob_S.c, falle: beob_S.falle, turns: beob_S.stat.turns }),
  v => { const S = beob_S; (v.found || []).forEach(k => S.found.add(k)); (v.given || []).forEach(k => S.given.add(k)); (v.bonus || []).forEach(k => S.bonus.add(k)); S.done = !!v.done;
    S.k2seen = !!v.k2seen; (v.dyn || []).forEach(k => S.dyn.add(k)); if (v.c && typeof v.c === 'object') S.c = Object.assign(beob_cNeu(+v.c.k || 0), v.c); S.lit = S.c.lit = +v.lit || S.c.lit || 0;
    S.falle = v.falle || null; S.stat.turns = +v.turns || 0; for (const n of S.spots) if (S.found.has(n.id)) beob_hideSpot(n); beob_desc(); }]);
function beob_ch() { return typeof kap === 'function' ? kap() : typeof curChapter === 'function' ? curChapter() : 1; }
function beob_mode() {
  if (!state.started || (typeof menu !== 'undefined' && menu.attract) || state.ending) return 'aus';
  const k = beob_ch(); if (k >= 7) return 'aus';
  if (ch3.on && ch3.part === 'white') return 'aus'; // Nimmerheim: sie lässt ihn nicht rein
  if (typeof k5 !== 'undefined' && k5.on && ['tisch', 'schleife', 'foto2', 'spieluhr'].includes(k5.beat)) return 'aus'; // er hat Nr. 1 vor der Schleife verlassen
  if (k <= 1) return state.inBasement ? 'aus' : 'klang'; // Kellertür Nr. 7 ist aus Eisen
  if (k === 2) return ch2.on && !ch3.on ? 'decke' : 'klang';
  if (state.zone === 'canal') return 'decke'; // unter der Erde nur über der Decke
  return 'voll';
}
function beob_active() { return beob_mode() === 'voll'; } // Altname (andere Module): sichtbar/verfolgend nur ab Kap. 3
function beob_quiet() { return state.talking || !!ui.overlay || !!scripted || dir.busy || state.blackout || (typeof hunt !== 'undefined' && hunt.on) || (typeof kino_S !== 'undefined' && kino_S.on)
  || (typeof hungrige_S !== 'undefined' && (hungrige_S.cine || hungrige_S.ev)) || (typeof spannung_hushed === 'function' && spannung_hushed()); }
function beob_sperre() { // erzwungene Stille: zählt für die Stille-Regel („wenn ich leise bin, ist was da, das ich nicht mag“)
  const S = beob_S, k = beob_ch(), P = player.pos;
  if (S.t < S.stillUntil || S.t < S.peakUntil || S.t < S.winUntil) return true;
  if (typeof SP !== 'undefined' && SP.silent > .3) return true; // Stille-Zonen (Wendigo)
  if (k >= 6 && typeof hungrige_S !== 'undefined' && (hungrige_S.ev || hungrige_S.cine)) return true;
  if (k >= 5 && typeof graukind !== 'undefined' && graukind.visible && Math.hypot(graukind.position.x - P.x, graukind.position.z - P.z) < 35) return true;
  if (typeof lwo_beobSperre === 'function') { try { if (lwo_beobSperre()) return true; } catch (e) {} }
  if (typeof LWO !== 'undefined' && LWO.F) { try { for (const key in LWO.F) { const F = LWO.F[key], g = F && F.g; if (!g || !g.visible) continue; const d = Math.hypot(g.position.x - P.x, g.position.z - P.z);
      if (key[0] === 'b' ? d < 25 : key === 'wolter' ? d < 45 : false) return true; } } catch (e) {} } // nie in einem Bild mit Wolter, still bei den Blechmännern (Eisen an den Kapuzen)
  for (const f of BEOB_SPERREN) { try { if (f()) return true; } catch (e) {} }
  return false;
}
function beob_traurig() { try { if (typeof spannung_traurig === 'function') return !!spannung_traurig(); if (typeof SP !== 'undefined' && SP.sad && SP.t < SP.sad) return true; } catch (e) {} return beob_S.t < (beob_S.sadUntil || 0); }
function beob_indoor() { return ch2.on && !ch3.on || state.inBasement || state.zone === 'canal' || (typeof indoorRect === 'function' && !!indoorRect()); }
function beob_town() { return ch3.on && ch3.part === 'town' || beob_ch() >= 4; }
const beob_V = new THREE.Vector3(), beob_V2 = new THREE.Vector3();
function beob_gy(x, z) { const P = player.pos, g = solidGround(x, P.y + 1.2, z); return g > P.y - 3 ? g : P.y; }
function beob_eisen(x, z, m = 1.1) { for (const b of beob_S.eisen) if (x > b[0] - m && x < b[1] + m && z > b[2] - m && z < b[3] + m) return true; return false; }
function beob_free(x, z) { if (beob_eisen(x, z)) return false; if (!beob_town()) return true; try { return !leben_inHouse(x, z, 1) && leben_free(x, z, .4, .6); } catch (e) { return true; } }
function beob_freeNah(x, z) { if (beob_eisen(x, z, .6)) return false; try { return !leben_inHouse(x, z, .3) && leben_free(x, z, .4, .17); } catch (e) { return true; } } // direkt an der Deckung
function beob_facing(x, y, z) { try { return leben_facing(x, y, z); } catch (e) { return 0; } }
function beob_setVp(x, y, z) { const S = beob_S; if (!S.vp) S.vp = new THREE.Vector3(); S.vp.set(x, y, z); }
function beob_pos() { const S = beob_S; if (!S.ready || !S.vpOk || !S.vp) return null; if (S.V && S.V.g.visible) return S.V.g.position; return S.vp; }
// ---------------------------------------------------------------- Die Zettel: Blatt aus einem Notizblock des Amts (blassblau kariert, oben abgerissen), Bleistift, Druckbuchstaben
function beob_html(t, o = {}) {
  const k6 = o.k === 6, s = t.replace(/~(.)~/g, '<s style="text-decoration-thickness:2px">$1</s>').replace(/\n/g, '<br>');
  return '<div style="position:relative;margin:4px auto;max-width:430px;padding:30px 30px 22px 44px;background-color:#eceae2;' +
    'background-image:linear-gradient(rgba(90,120,170,.16) 1px,transparent 1px),linear-gradient(90deg,rgba(90,120,170,.16) 1px,transparent 1px),radial-gradient(ellipse at 70% 80%,rgba(120,100,70,.10),transparent 60%);' +
    'background-size:17px 17px,17px 17px,100% 100%;box-shadow:0 8px 26px rgba(0,0,0,.55),inset 0 0 40px rgba(110,95,70,.18);transform:rotate(' + (o.rot ?? -.8) + 'deg);' +
    'clip-path:polygon(0 3%,4% 1%,9% 3.5%,14% 1.2%,19% 3%,25% .6%,31% 2.8%,37% 1%,43% 3.2%,50% .8%,56% 2.6%,62% 1.1%,68% 3.4%,74% 1%,80% 2.9%,86% .9%,92% 3.1%,100% 1.4%,100% 100%,0 100%)">' +
    '<div style="font-family:\'Courier New\',monospace;font-size:' + (k6 ? 16 : 17) + 'px;line-height:1.6;letter-spacing:' + (k6 ? '.03em' : '.08em') + ';color:' + (k6 ? '#2e2e34' : '#48484f') + ';' +
    'font-weight:' + (k6 ? 700 : 400) + ';text-transform:uppercase;text-shadow:0 0 .6px rgba(40,40,48,.7),.4px .3px 0 rgba(60,60,70,.25)">' + s + '<br><br>' + BEOB_SIG + '</div></div>';
}
function beob_fill(t) { const S = beob_S.stat; return t.replace('{pct}', Math.max(1, Math.round(FLASH.charge * 100))).replace('{turns}', Math.max(5, S.turns)).replace('{still}', Math.max(4, Math.round(S.stillMax))).replace('{off}', Math.max(3, beob_S.c.off || S.flashOff)); }
const BEOB_WAHL = { A: 'ER IST WIEDER DRIN. IN DER HAUT. SIE SIEHT IHN WIEDER NICHT.', B: 'ER SPIELT JETZT MIT. ER WEISS NICHT DASS ER UNSICHTBAR SPIELT.', C: 'DU HAST IHM GESAGT SIE MUSS IHN SEHEN. DAS WAR RICHTIG. ES WIRD TEUER.' };
const BEOB_FALLE = { mit: 'SIE HABEN DICH HINGESTELLT WIE EINEN TELLER. ICH HABE ES GESEHEN. ICH HABE NICHTS GESAGT', sabotage: 'DU HAST DAS NETZ KAPUTT GEMACHT. ICH HÄTTE ES NICHT GEKONNT. DANKE ODER NICHT DANKE, ICH WEISS ES NOCH NICHT', ab: 'DU HAST NEIN GESAGT. SIE HABEN DICH TROTZDEM HINGESTELLT. SO SIND SIE' };
const beob_in = (x0, x1, z0, z1) => { const P = player.pos; return P.x > x0 && P.x < x1 && P.z > z0 && P.z < z1; };
const beob_stuck = () => typeof gedanken_S !== 'undefined' && gedanken_S.objT > 100;
// Kennungen nach 02 A1 (Dossier 82 §5). Felder: k Kapitel · kind · when() Selbstauslöser (Rückfall, wenn das Kapitel-Skript ihn nicht vorher legt) · script: nur per beobachter_zettel ·
// wo: 'hinter' (Standard) | 'gitter' (Kap. 2: segelt aus dem Lüftungsgitter vor Luke) | 'vor' · stuck: Hilfe nur bei Festhängen · item Batterien · rh Rüstungs-Hinweis · luke Gedanke danach
const BEOB_DYN = [
  // Kapitel 1 (nur per Skript; Rückfall-Auslöser siehe beob_k1Tick)
  { id: 'b_k1_01', k: 1, title: 'Elf Mal', kind: 'gruselig', script: true, text: 'DU BIST ELF MAL NICHT RANGEGANGEN.\nSIE HAT ELF MAL GEWARTET BIS ES AUFHÖRT ZU KLINGELN.\nICH HAB MITGEZÄHLT. ICH ZÄHL IMMER.\nES IST NOCH NICHT ZU SPÄT. DAS SAGT MAN DOCH SO.',
    luke2: 'Elf. Er weiß, dass es elf waren. Das Handy weiß das. Und ich. Und …' },
  { id: 'b_k1_02', k: 1, title: 'Gute Nacht', kind: 'hilfe', script: true, text: 'DIE FRAU HAT DEN TAG EINGEKREIST\nAN DEM SIE ZURÜCK KAM. NICHT LUCY. DIE ANDERE.\nDU DRÜCKST DIE FALSCHEN. DIE RICHTIGEN SIND SCHON GLATT.\nWARUM SAGT IHR GUTE NACHT WENN SIE NICHT GUT IST' },
  // Kapitel 2 · Amt, Ebene −2 (Zettel fallen aus Lüftungsgittern, nie hinter Luke im selben Raum)
  { id: 'b_k2_01', sofort: true, k: 2, title: 'Aus', kind: 'gruselig', wo: 'gitter', when: () => ch2.on && beob_in(C2.x + 2, C2.x + 16, C2.z - 2, C2.z + 2), text: 'DAS KIND SPIELT HIER UNTEN NICHT. AUS.\nDIE MÄNNER MIT KETTEN SPIELEN TROTZDEM' },
  { id: 'b_k2_02', k: 2, title: 'Lest es dann nicht', kind: 'frage', wo: 'gitter', when: () => ch2.on && ch2.archiveSolved && beob_in(C2.x + 18, C2.x + 30, C2.z - 6, C2.z + 6) && beob_S.t - (beob_S.k2arch || 1e9) > 25, text: 'WARUM SCHREIBT IHR ALLES AUF UND LEST ES DANN NICHT' },
  { id: 'b_k2_03', sofort: true, k: 2, title: 'Erste Hilfe', kind: 'hilfe', wo: 'vor', item: 3, when: () => ch2.on && FLASH.charge < .25 && !(typeof hunt !== 'undefined' && hunt.on) && beob_in(C2.x + 30.2, C2.x + 35.8, C2.z + 2.2, C2.z + 7.8), text: 'DEIN LICHT WIRD MÜDE. DEINE LAMPE HAT NOCH {pct} %.\nDIE HIER SIND AUS DEM KASTEN AN DER WAND.\nDER KASTEN HEISST ERSTE HILFE ABER DA IST KEINE HILFE DRIN' },
  { id: 'b_k2_04', sofort: true, k: 2, title: 'Danke', kind: 'gruselig', wo: 'vor', leise: true, bonbon: true, when: () => ch2.on && typeof feuer_S !== 'undefined' && feuer_S.done && !scripted && !state.talking, sad: 120,
    text: 'DANKE. ER HAT GEWEINT. ICH HAB ES GEHÖRT.\nMEINE SCHWESTER AUCH.\nSIE WAR IN IHM DRIN. JETZT NICHT MEHR.\nISS DAS. DU ZITTERST.' },
  { id: 'b_k2_05', k: 2, title: 'Kein Eisen', kind: 'gruselig', wo: 'gitter', rh: 'RH-1', when: () => ch2.on && ch2.archiveSolved && beob_S.t - (beob_S.k2arch || 1e9) > 60, text: 'DIE MIT DEN KETTEN HALTEN MINUTEN. ER HÄLT JAHRE.\nSEINS IST KEIN EISEN' },
  { id: 'b_k2_06', k: 2, title: 'Einmachen', kind: 'gruselig', script: true, text: 'ZWEI VON UNS IN GLAS. ICH HAB DAS WORT GELERNT. EINMACHEN.\nIHR MACHT ALLES EIN WAS IHR NICHT VERSTEHT' },
  { id: 'b_k2_07', sofort: true, k: 2, title: 'Ich sehe immer nur zu', kind: 'gruselig', wo: 'gitter', spur: 'bonbon', when: () => ch2.on && ch2.safeOpen, text: 'ER HAT DICH HERAUSGETRAGEN. DU HAST GESCHLAFEN.\nICH HAB ZUGESEHEN. ICH SEHE IMMER NUR ZU' },
  { id: 'b_k2_h1', k: 2, title: 'Ordnungstafel', kind: 'hilfe', wo: 'gitter', stuck: true, when: () => ch2.on && !ch2.archiveSolved && !ch2.power && beob_in(C2.x + 18, C2.x + 30, C2.z - 6, C2.z + 6),
    text: 'WER ZUERST HEIMKAM STEHT LINKS. SO WOLLTE ES DAS AMT.\nDAS MÄDCHEN DAS DAS HAUS ANGEZÜNDET HAT KAM ZUERST.\nDER MIT DEN LOCKEN KAM NIE. DER STEHT GANZ RECHTS.\nDIE ZEITUNGEN WISSEN DIE TAGE. ICH AUCH. ABER FRAG DIE ZEITUNGEN.' },
  { id: 'b_k2_h2', k: 2, title: 'Die Schalter', kind: 'hilfe', wo: 'gitter', stuck: true, when: () => ch2.on && ch2.archiveSolved && !ch2.power && beob_in(C2.x + 30, C2.x + 36, C2.z + 2, C2.z + 8),
    text: 'DIE SCHALTER MÖGEN ES NICHT WENN MAN AM RAND ANFÄNGT.\nDER ERSTE UND DER LETZTE SIND EMPFINDLICH. LASS SIE.\nFANG IN DER MITTE AN UND GEH NICHT ZURÜCK.' },
  { id: 'b_k2_um', k: 2, title: 'Umgedreht', kind: 'gruselig', wo: 'gitter', when: () => ch2.on && ch2.power && beob_S.stat.turns >= 5, text: 'DU HAST DICH {turns} MAL UMGEDREHT SEIT DU HIER UNTEN BIST.\nICH WAR JEDES MAL NICHT DA.\nICH BIN ÜBER DIR. DA GUCKT KEINER HIN.',
    luke: 'Über mir.', nach: 'decke' },
  // Kapitel 3 · offene Nacht
  { id: 'b_k3_01', sofort: true, k: 3, title: 'Ist das ein Gebet', kind: 'humor', spur: 'kiesel', when: () => ch3.on && ch3.part === 'town' && ch3.cowSeen && !scripted && !state.talking && beob_S.stat.still < 60, text: 'DU HAST DREI MAL SCHEISSE GESAGT.\nIST DAS EIN GEBET', luke: 'Ja. Heute schon.' },
  { id: 'b_k3_02', sofort: true, k: 3, title: 'Offener Mund', kind: 'gruselig', when: () => ch3.on && beob_S.c.sight1 && beob_S.stat.still > 3 && Math.hypot(player.pos.x - 4, player.pos.z - 4) < 22,
    text: 'IM AUTO AM ORTSSCHILD HAST DU MIT OFFENEM MUND GESCHLAFEN.\nICH HAB AM PFOSTEN GEWARTET BIS DU AUFWACHST. DIE DREI STRICHE SIND VON MIR.\nDER VOGEL SASS AUF DEINEM DACH UND HAT GANZ LEISE GEREDET. WIE EINE FRAU.\nDAS MACHT ER SONST NIE.',
    luke: 'Der Traum. Der Rabe auf der Laterne. … Und ich schlafe nicht mit offenem Mund.' },
  { id: 'b_k3_03', k: 3, title: 'Kutsche', kind: 'lwo', script: true, text: 'DER GRAUE MANN RIECHT NACH MEINER SCHWESTER.\nSTEIG NICHT IN SEINE KUTSCHE',
    variante: () => (story.lwo && story.lwo.trust < 30) ? '\nER HAT EINE MAPPE AUF DEM BEIFAHRERSITZ. DA STEHT DEIN NAME DRAUF. MIT BLEISTIFT. DAMIT MAN IHN WEGMACHEN KANN.' : '' },
  { id: 'b_k3_04', sofort: true, k: 3, title: 'Nicht nachdenken', kind: 'frage', when: () => ch3.on && ch3.part === 'town' && Math.hypot(player.pos.x + 28, player.pos.z + 8) < 7, text: 'WIE HIESS EUER HUND. NICHT NACHDENKEN. EINFACH WISSEN.\n… SIEHST DU.\nUND DER VOM ALTEN MANN. DER BELLT NIE WENN ICH DA BIN. WIE HEISST DER',
    luke: 'Flocke. Und der da heißt Bruno. Wieso willst du das wissen?' },
  { id: 'b_k3_05', sofort: true, k: 3, title: 'Unhöflich', kind: 'gruselig', when: () => ch3.on && beob_S.c.lit >= 3, text: 'DU HAST MICH DREI MAL ANGELEUCHTET. ES TUT NICHT WEH. ES IST NUR UNHÖFLICH.\nMACH DAS LICHT AUS WENN DU MICH SEHEN WILLST.' },
  { id: 'b_k3_05b', sofort: true, k: 3, title: 'Unhöflich', kind: 'gruselig', statt: 'b_k3_05', when: () => ch3.on && beob_S.c.off >= 3 && beob_S.c.lit < 3, text: 'DU HAST DIE LAMPE {off} MAL AUSGEMACHT.\nIM DUNKELN SIEHST DU MEHR. ICH AUCH.' },
  { id: 'b_k3_06', k: 3, title: 'Leise', kind: 'gruselig', papier: true, script: true, text: 'ICH WAR LEISE. DU HAST ES GEMERKT. GUT.\nWENN ICH LEISE BIN IST WAS DA DAS ICH NICHT MAG.\nMERK DIR DAS. DAS WIRD NOCH WICHTIG.' },
  { id: 'b_k3_07', k: 3, title: 'Das Glück läuft raus', kind: 'gruselig', script: true, text: 'ICH HAB DAS EISEN ÜBER DER TÜR GEDREHT. MIT EINEM STOCK. ANFASSEN KANN ICH DAS NICHT.\nJETZT LÄUFT DAS GLÜCK RAUS. SAGT IHR DOCH SO.\nWO DAS EISEN FALSCH HÄNGT IST EINER DRIN DER NICHT MEHR GANZ HIER IST.\nHEUTE NICHT REINGEHEN. HEUTE NICHT.' },
  { id: 'b_k3_08', k: 3, title: 'Sie sagt ich bin komisch', kind: 'gruselig', script: true, text: 'DA DRIN HÖRST DU MICH NICHT. ICH DARF NICHT REIN.\nSIE SAGT ICH BIN KOMISCH' },
  { id: 'b_k3_08b', k: 3, title: 'Sie sagt ich bin komisch', kind: 'gruselig', script: true, rh: 'RH-4', text: 'SIE SUCHT IHN UND ER STEHT DA. SIE GUCKT DURCH IHN DURCH.\nWIE DURCH IHR HAUS' },
  { id: 'b_k3_h1', k: 3, title: 'Funkkasten', kind: 'hilfe', stuck: true, when: () => ch3.on && !ch3.radio && Math.hypot(player.pos.x - 5.4, player.pos.z + 6.6) < 6,
    text: 'DER EISERNE KASTEN HÖRT NUR AUF EINE ZAHL.\nDU HAST SIE HEUTE NACHT SCHON EINMAL GEDRÜCKT. UNTEN AN EINER TÜR.\nHILDE HAT FÜR ALLES DENSELBEN TAG GENOMMEN. SIE HATTE ANGST SIE VERGISST WAS.' },
  { id: 'b_k3_h2', k: 3, title: 'Schreib’s', kind: 'hilfe', script: true, text: 'SIE KANN ALLES NACHSPRECHEN.\nSIE KANN NICHT LESEN WAS NIE LAUT WAR' },
  { id: 'b_k3_h3', sofort: true, k: 3, title: 'Laternen', kind: 'hilfe', when: () => ch3.on && !ch3.lampsOff && Math.max(ch3.lampFails || 0, typeof lucy3_S !== 'undefined' ? lucy3_S.lampFails || 0 : 0) >= 2,
    text: 'SIE HAT DIE LICHTER NICHT DURCHEINANDER AUSGEPUSTET.\nSIE HOLT SIE WIE IHR SIE HERGEGEBEN HABT. WER ZUERST UNTERSCHRIEBEN HAT.\nWER WEGGEZOGEN IST WIRD ÜBERSPRUNGEN. DA BRENNT KEIN LICHT MEHR FÜR SIE.' },
  { id: 'b_k3_n1', k: 3, title: 'Die dreizehnte Predigt', kind: 'hilfe', script: true, text: 'DER MANN AUS PAPIER HAT AUCH GEZÄHLT. ER HAT BEI ADVENT ANGEFANGEN.' },
  { id: 'b_x_01', sofort: true, k: 3, bis: 6, title: 'Der Vogel', kind: 'gruselig', when: () => typeof whiskey_S !== 'undefined' && whiskey_S.mood === 'still' && (beob_S.wStill || 0) > 5, text: 'DER VOGEL SIEHT MICH. ER SAGT NICHTS. ER HAT NIE ETWAS GESAGT' },
  // Kapitel 4 · bei Tag
  { id: 'b_k4_01', sofort: true, k: 4, title: 'Die Bilder weiß', kind: 'gruselig', when: () => beob_ch() === 4 && Math.hypot(player.pos.x - 24, player.pos.z + 8) < 12 && beob_S.stat.turns >= 1, text: 'DIE MÄNNER MACHEN DIE BILDER WEISS.\nWARUM. DIE BILDER WAREN DOCH SCHON DA.\nICH HAB DIE ECHTEN. HINTER DER TONNE VON NEUN.' },
  { id: 'b_k4_02', k: 4, title: 'Was mit Essen drin', kind: 'lwo', script: true, text: 'DIE MIT DEN STULLEN WOLLEN HILDES BUCH.\nDA STEH ICH DRIN. ALS NEUN. DANN ZÄHLEN SIE MICH AUCH.\nWENN DU IHNEN WAS ANDERES GIBST DANN WAS MIT ESSEN DRIN.\nDAS LESEN SIE LANGSAMER.' },
  { id: 'b_k4_02b', k: 4, title: 'Immer nur gesucht', kind: 'gruselig', script: true, text: 'JETZT BIN ICH IN IHRER AKTE. NEUN.\nSIE HABEN MICH NIE GEZÄHLT. IMMER NUR GESUCHT' },
  { id: 'b_k4_02c', k: 4, title: 'Trotzdem nicht da', kind: 'gruselig', script: true, text: 'SIE HABEN MICH GEZÄHLT. JETZT HABEN SIE ES SCHRIFTLICH.\nICH BIN TROTZDEM NICHT DA.' },
  { id: 'b_k4_03', k: 4, title: 'Hildes ungelesener Zettel', kind: 'fund', script: true, text: 'DU ZÄHLST RICHTIG. ES SIND NEUN.\nDER NEUNTE BIN ICH. ICH TU KEINEM WAS. ICH STEH NUR MIT DA.\nDU MUSST NICHT JEDE NACHT RAUSGEHEN. ICH ZÄHL FÜR DICH MIT.\nSCHLAF MAL.' },
  { id: 'b_k4_04', k: 4, title: 'Wen von euch beiden', kind: 'frage', script: true, text: 'SIE IST WIEDER DA. FAST. DAS HELLE IN IHREN AUGEN GEHT WEG WENN SIE SCHLÄFT.\nWENN SIE AUFWACHT UND EUCH BEIDE SIEHT\nWEN VON EUCH BEIDEN ERKENNT SIE', luke: 'Uns beide. Es gibt nur einen von … ' },
  { id: 'b_k4_h1', k: 4, title: 'Acht Löcher', kind: 'hilfe', stuck: true, when: () => typeof anwesen_S !== 'undefined' && (anwesen_S.ch4 || /Villa Seiler. Schließ/.test(beob_obj())) && !anwesen_S.open && Math.hypot(player.pos.x + 111, player.pos.z - 60.5) < 14,
    text: 'ACHT LÖCHER. ACHT TEILE. DU HAST NICHT ALLE.\nWAS DU LIEGEN GELASSEN HAST HAT DER VOGEL GEHOLT. ER HEBT ALLES AUF WAS GLÄNZT.\nGUCK WO ER WOHNT. NICHT WO ER SITZT.\nMACH AUF. ICH KOMM DA ALLEIN NICHT REIN. DIE TÜR IST AUS EISEN.' },
  { id: 'b_k4_h2', k: 4, title: 'Das Kalte ist blau', kind: 'hilfe', script: true, text: 'DAS KALTE IST BLAU. DAS BETT IST GRAU.\nICH HAB SIE RAUSGEDREHT DAMIT ES SCHLÄFT.\nES HAT NICHT GESCHLAFEN' },
  { id: 'b_k4_05', k: 4, title: 'Im Schrank daneben', kind: 'gruselig', script: true, text: 'DU HAST {still} SEKUNDEN IM SCHRANK GESTANDEN UND NICHT GEATMET.\nICH AUCH. IM SCHRANK DANEBEN.\nDER LANGE HAT ZWEI MAL IN MEINEN GEGUCKT. ER SIEHT NUR MÄNTEL.' },
  { id: 'b_k4_06', k: 4, title: 'Der Deckel ist aus Eisen', kind: 'gruselig', script: true, text: 'DAS GLAS DAS SICH BEWEGT IST MEIN BRUDER. ES BEWEGT SICH NUR DAS FLEISCH. ER NICHT MEHR.\nDAS LEERE WAR MEINE SCHWESTER. SIE HAT ELF TAGE ZUGESEHEN. ICH AUCH. VON DRAUSSEN.\nSIE HAB ICH GEHOLT. IHN KANN ICH NICHT.\nDER DECKEL IST AUS EISEN.' },
  { id: 'b_k4_06b', k: 4, title: 'Schwerer als sie', kind: 'gruselig', script: true, text: 'DU HAST DEN DECKEL AUFGEMACHT.\nER IST SCHWERER ALS SIE. ICH HAB IHN TROTZDEM GETRAGEN.\nJETZT LIEGEN SIE ZUSAMMEN. WO SAG ICH NICHT. SONST MACHT IHR SIE WIEDER EIN.\nDANKE' },
  { id: 'b_k4_07', k: 4, title: 'K heißt Kopie', kind: 'frage', script: true, text: 'K HEISST KOPIE. DAS STEHT NICHT AN DER TÜR. SIE MEINEN ES ABER.\nWENN DU EINE KOPIE BIST\nWESSEN HEIMWEH HAST DU DANN' },
  { id: 'b_k4_08', k: 4, title: 'Ich übe', kind: 'gruselig', script: true, text: 'DU HAST SEINE HAND GESEHEN. SIE IST WIE MEINE. OHNE LINIEN.\nER HAT MEINE SCHWESTER GETRUNKEN DAMIT ER NICHT ALT WIRD. DESHALB FRIERT ER.\nICH HASSE IHN NICHT. ICH WEISS NICHT WIE DAS GEHT.\nICH ÜBE.' },
  { id: 'b_k4_n1', k: 4, title: 'Akte K-2', kind: 'fund', script: true, text: 'DER ACHTE WAR NICHT ICH' },
  { id: 'b_k4_n2', k: 4, title: 'Blatt 213', kind: 'fund', script: true, text: 'IHR ZÄHLT AUCH. ABER FALSCH' },
  { id: 'b_k4_n3', k: 4, title: 'Acht Schlösser', kind: 'gruselig', script: true, text: 'DER DOKTOR HAT DIE TEILE VERSTECKT WO IHR EUCH VERSTECKT HABT.\nICH HAB ZUGESEHEN. ER HAT BEIM VERGRABEN GEWEINT.\nER HAT GESAGT „VERZEIH“. ZU WEM WEISS ICH NICHT. DA WAR NUR ICH.' },
  { id: 'b_k4_n4', k: 4, title: 'Fünf ist das Höchste', kind: 'gruselig', script: true, text: 'DER MANN IM MANTEL HAT DIE HEIZUNG AUF FÜNF. FÜNF IST DAS HÖCHSTE.\nER FRIERT TROTZDEM. ICH HAB IHM EINMAL EINE DECKE HINGELEGT.\nER HAT SIE ANGEZÜNDET.' },
  { id: 'b_k4_n5', k: 4, title: 'Vermischtes', kind: 'hilfe', script: true, text: 'DER MIT DEN KLOPFZEICHEN WOHNT IM BERG. DER IM WASSER SINGT. MEHR SAG ICH NICHT.' },
  { id: 'b_k4_n6', k: 4, title: 'Ich war da', kind: 'gruselig', script: true, text: 'DIE FRAU HAT GEFRAGT OB ER WEINT. ER HAT. ICH WAR DA' },
  // Kapitel 5 · Vater-Mutter-Kind (Beats von AP-21/22)
  { id: 'b_k5_01', k: 5, title: 'Zwei mal dieselbe', kind: 'gruselig', script: true, text: 'ZWEI MAL DIESELBE. EINE SCHLÄFT. ICH ZÄHLE TROTZDEM EINS' },
  { id: 'b_k5_02', k: 5, title: 'Sommer', kind: 'humor', script: true, text: 'IN DEM HAUS IST SOMMER. DRAUSSEN IST NOVEMBER. GEH MIT JACKE REIN UND KOMM MIT JACKE RAUS' },
  { id: 'b_k5_03', k: 5, title: 'Noch nie ein Bild', kind: 'gruselig', script: true, text: 'DU HAST SIE FOTOGRAFIERT. SIE HAT NOCH NIE EIN BILD VON SICH GESEHEN. JETZT WEISS SIE WIE SIE AUSSIEHT' },
  { id: 'b_k5_04', k: 5, title: 'Brote', kind: 'gruselig', script: true, text: 'DER JUNGE IM STROH ZÄHLT AUCH. ER ZÄHLT BROTE. ES SIND MEHR ALS DEINE ANRUFE' },
  { id: 'b_k5_05', k: 5, title: 'Nachher', kind: 'lwo', script: true, text: 'AUF DEM PAPIER BIST DU WEG. DIE MÄNNER MIT HUT SCHREIBEN GERN VORHER AUF. ICH SCHREIBE NACHHER' },
  { id: 'b_k5_06', k: 5, title: 'Ist das Verstecken', kind: 'frage', script: true, text: 'WARUM LEGT IHR EUCH IN DIE ERDE WENN SIE DA UNTEN KEINEN SIEHT. IST DAS VERSTECKEN' },
  { id: 'b_k5_07', k: 5, title: 'Meine Bilder', kind: 'gruselig', script: true, text: 'ICH GEH DA NICHT REIN. DA DRIN FRISST EINER MEINE BILDER' },
  { id: 'b_k5_h1', k: 5, title: 'Schlafenszeit', kind: 'hilfe', script: true, text: 'SIE PUSTET WAS BRENNT. SIE PUSTET NICHT WAS IHRER MAMA GEHÖRT' },
  { id: 'b_k5_n1', k: 5, title: 'Ich war da', kind: 'gruselig', script: true, text: 'DIE FRAU HAT GEFRAGT OB ER WEINT. ER HAT. ICH WAR DA' },
  // Kapitel 6 · Wald ohne Echo (kürzer, gedrückter)
  { id: 'b_k6_01', sofort: true, k: 6, title: 'Hinter dir', kind: 'gruselig', when: () => beob_ch() === 6 && (beob_S.waldT || 0) > 60, text: 'ICH HAB GESAGT ICH GEH DA NICHT REIN.\nICH BIN TROTZDEM DA. HINTER DIR IST ES BESSER ALS ALLEIN.\nWENN ICH LEISE BIN IST ER DA. DANN MACH DEIN LICHT AN. NICHT AUS.' },
  { id: 'b_k6_02', sofort: true, k: 6, title: 'Er frisst was ich sammle', kind: 'gruselig', when: () => beob_ch() >= 6 && typeof hungrige_S !== 'undefined' && hungrige_S.done.size >= 2, text: 'DAS REH IST NICHT RÜCKWÄRTS GEGANGEN.\nDU HAST NUR NICHT GESEHEN WO VORNE WAR.\nGEH NICHT OHNE LICHT TIEF~F~ER. ER FRISST WAS ICH SAMMLE' },
  { id: 'b_k6_03', k: 6, title: 'Bin ich reich', kind: 'humor', script: true, text: 'DU HAST EINE FLASCHE MITGENOMMEN. IM WALD.\nDER ALTE MANN SAGT DAFÜR KRIEGT MAN GELD.\nICH HAB SIEBZEHN. IM BUS. BIN ICH REICH', luke: 'Ein Euro sechsunddreißig. Mit Glück. … Ja. Für hier schon.' },
  { id: 'b_k6_04', k: 6, title: 'Er schabt', kind: 'gruselig', script: true, text: 'DAS WAR NICHT ER.\nER SCHABT. WENN ER GEHT SCHABT DIE HAUT AN DER HAUT.\nDAS DA SCHABT NICHT.' },
  { id: 'b_k6_05', k: 6, title: 'Lange her', kind: 'gruselig', script: true, text: 'WIR HABEN IHM DIE HAUT GEGEBEN. DAMIT ER DRIN NICHT GRAU WIRD.\nDAS HAUS SIEHT SEINE EIGENE HAUT NICHT. UND SIE GUCKT MIT DEM HAUS.\nOB WIR DAS GEWUSST HABEN.\nDAS IST LANGE HER. AUCH FÜR MICH.' },
  { id: 'b_k6_06', k: 6, title: 'Du bist der Speck', kind: 'lwo', script: true, text: 'SO HABEN SIE MEINE GESCHWISTER GEFANGEN. MIT NETZEN AUS EISEN. UND MIT WARTEN.\nJETZT BIST DU DER SPECK.\nDER VOGEL WÜRDE DICH KLAUEN. ICH KANN DAS NICHT.\nICH SITZ HIER UND GUCK ZU. DAS KANN ICH.',
    variante: () => (story.lwo && story.lwo.ag18 === 'mit') ? '\nDU HAST JA GESAGT. WARUM' : '', rueck: () => beob_S.falle && BEOB_FALLE[beob_S.falle] },
  { id: 'b_k6_07', k: 6, title: 'Frag dich warum', kind: 'gruselig', script: true, text: 'ICH HABE DICH NICHT GERETTET.\nDER VOGEL HAT DAS GEMACHT.\nICH HABE NUR ZUGESEHEN. FRAG DICH WARUM.',
    variante: () => { const a = ch3.answer || ch3.choice; return BEOB_WAHL[a] ? '\n' + BEOB_WAHL[a] : ''; }, luke: 'Warum. Weil du nicht kannst? Oder weil du nicht willst?' },
  // Rätsel-Zettel (führen zu B-O4, B-O6, B-O15, B-O16)
  { id: 'r_briefkasten', k: 3, bis: 6, title: 'Rätsel', kind: 'raetsel', cache: 'briefkasten', when: () => beob_town(), text: 'ICH HAB EINEN MUND UND ESSE NUR PAPIER.\nDIE FRAU BEI DER ICH WOHNE HAT MICH NIE GEFÜTTERT. SIE HAT NUR REINGEGUCKT.\nHEUTE HAB ICH WAS FÜR DICH IM BAUCH.' },
  { id: 'r_stein', k: 3, bis: 6, title: 'Rätsel', kind: 'raetsel', cache: 'friedhof', when: () => beob_town(), text: 'WO SIEBEN NAMEN STEHEN UND DER ACHTE KEINEN HAT\nLIEGT WAS DEIN LICHT LÄNGER MACHT.' },
  { id: 'r_hochsitz', k: 6, title: 'Rätsel', kind: 'raetsel', cache: 'hochsitz', when: () => player.pos.z > 90, text: 'ICH STEHE AUF VIER BEINEN IM WALD UND HAB KEINEN KOPF.\nWER AUF MICH STEIGT SIEHT WO DER WALD AUFHÖRT.\nUNTER MIR HAB ICH WAS VERGESSEN. MIT ABSICHT.' },
  { id: 'r_bus', k: 6, title: 'Rätsel', kind: 'raetsel', cache: 'bus', when: () => player.pos.z > 150, text: 'ICH TRAG DIE DIE NIE ANGEKOMMEN SIND.\nMEINE RÄDER SIND IN DEN BODEN GEWACHSEN.\nNEBEN MIR SCHLAFEN DIE SCHWEINE. UND DEIN GESCHENK.' },
];
const BEOB_NOT = { id: 'd_not', title: 'Im Dunkeln bist du laut', kind: 'hilfe', item: 2, text: 'DU HAST KEINE MEHR. UND DEINE LAMPE HAT NOCH {pct} %.\nIM DUNKELN BIST DU LAUT.\nHIER. ZWEI.' };
const BEOB_NOT6 = 'DU HAST KEINE MEHR. UND DEINE LAMPE HAT NOCH {pct} %.\nIM DUNKELN BIST DU LAUT.\nHIER. ZWEI. GEH NICHT OHNE.';
// Die neunzehn Orts-Zettel B-O1 … B-O19 (Nebenaufgabe „Hinter deinen Füßen“; Koordinaten und Boni wie bisher, Texte Dossier 82 §5.7)
const BEOB_ORTE = [
  { id: 'kreuzung', kenn: 'B-O1', name: 'Kreuzung', x: 3.5, z: 3.2, text: 'HIER STEHEN SIE NACHTS BARFUSS. ACHT. DIE FRAU AUS DER SIEBEN HAT SIE JEDE NACHT GEZÄHLT.\nALS DU NEU WARST WARST DU EINER DAVON. DER RITTER HATTE DICH AN DER HAND.\nDU HAST NICHT GEWEINT. ER SCHON.' },
  { id: 'nr1', kenn: 'B-O2', name: 'Nr. 1', x: -47, z: -8.8, text: 'EUER HAUS. DAS BETT AM FENSTER.\nDU HAST DA GESCHLAFEN ALS WÄRE ES DEINS. ES WAR AUCH DEINS.\nBEI EUCH GEHÖRT EINEM WAS MAN LIEB HAT. BEI UNS IST DAS ANDERS.\nICH FIND EURES BESSER.' },
  { id: 'nr3', kenn: 'B-O3', name: 'Nr. 3', x: -28, z: -8.8, text: 'DER ALTE MANN HAT MIT ALLEM RECHT GEHABT. AUCH MIT MIR.\nER HAT MICH NUR NIE GESEHEN. ER GUCKT IMMER NACH OBEN.\nDIE FOLIE AM FENSTER HILFT GEGEN NICHTS. ABER SIE GLÄNZT SCHÖN. FINDET DER VOGEL AUCH.' },
  { id: 'briefkasten', kenn: 'B-O4', name: 'Briefkasten Nr. 7', x: 28.4, z: -5.9, bonus: 2, text: 'GUT GERATEN. ZWEI FÜR DEINE LAMPE.\nNICHT ALLES WAS IN DIESEN KASTEN GEHT KOMMT AN.\nDER MANN MIT DEM FAHRRAD NIMMT MANCHES WIEDER MIT. ICH HAB GESEHEN WOHIN. HINTER DIE TANKSTELLE.' },
  { id: 'kapelle', kenn: 'B-O5', name: 'Kirchberg', x: -4.5, z: 45.5, text: 'DIE GLOCKE SCHLÄGT DREI UND DANN DREIZEHN.\nFRÜHER STAND HIER EINE KAPELLE AUS HOLZ. DIE HAT IN DER NACHT AUCH DREI GESCHLAGEN.\nICH HAB SIE GEHÖRT UND GEDACHT DA RUFT EIN TIER.\nES WAR EIN TIER DAS RUFT. NUR AUS METALL.' },
  { id: 'friedhof', kenn: 'B-O6', name: 'Gedenkfeld', x: -47.6, z: 71.6, bonus: 1, text: 'DER STEIN MIT DER ACHT. DA LIEGT EINER DEN KEINER HABEN WOLLTE.\nSEINE MUTTER HAT IHN DREI JAHRE GEBADET UND HANS GENANNT. ER HAT SICH DRAN GEWÖHNT.\nICH WAR AUF SEINER BEERDIGUNG. HINTER DER HECKE. SONST WAREN NUR ZWEI MÄNNER DA.' },
  { id: 'spielplatz', kenn: 'B-O7', name: 'Spielplatz', x: 31, z: 70, text: 'EISEN IST FREI. DIE KREIDE AM BODEN.\nDAS HAB ICH NICHT GESCHRIEBEN. ABER WENN ES GEREGNET HAT HAB ICH ES NACHGEMALT.\nOFT. KEINER HAT DANKE GESAGT. DAS IST OK. IHR WISST JA NICHT VON WEM.' },
  { id: 'tankstelle', kenn: 'B-O8', name: 'Tankstelle', x: 109.5, z: 20, bonus: 1, text: 'HIER GIBT ES DIE BONBONS DIE KALT SCHMECKEN.\nMIKE HAT SIE GEKLAUT. ICH AUCH. ER HAT MIR JEDEN ABEND EINS AUF DIE ZAPFSÄULE GELEGT.\nER HAT NIE GEFRAGT FÜR WEN. JETZT IST ER WEG UND DIE BONBONS SIND NOCH DA.\nDAS IST FALSCH RUM.' },
  { id: 'sperre', kenn: 'B-O9', name: 'Straßensperre', x: 145.5, z: 2.5, text: 'DIE WEISSEN AUTOS SIND NICHT KAPUTT. SIE WARTEN.\nDU BIST HIER EINMAL WEGGEFAHREN. ICH HAB DICH NICHT AUFGEHALTEN. ICH HALTE NIE EINEN AUF.\nWER HIER RAUS WILL MUSS WISSEN WOHIN. WEISST DU ES' },
  { id: 'schreber', kenn: 'B-O10', name: 'Schrebergärten', x: -114, z: 24, text: 'DIE VOGELSCHEUCHE HAT EINE KINDERJACKE AN.\nDIE GEHÖRT EINEM JUNGEN DER NICHT GRÖSSER WIRD. ER KOMMT NACHTS UND SAGT IHR GUTE NACHT.\nWARUM SAGT IHR GUTE NACHT ZU JACKEN' },
  { id: 'hof', kenn: 'B-O11', name: 'Hof', x: -127, z: -26, rh: 'RH-11', text: 'HIER HAT ER GEWOHNT. DER IN DER GRAUEN HAUT. DAMALS WAR ALLES AUS HOLZ UND ES ROCH NACH BROT.\nIM WINTER DANACH HAT ER JEDE NACHT AM RAND IM SCHNEE GESESSEN.\nWIR AUCH. AUF DER ANDEREN SEITE. WIR HABEN GEWARTET BIS ER UNS ANGUCKT.\nER TRÄGT DAS HAUS. DAS HAUS SIEHT SICH SELBST NICHT.',
    luke: 'Das Haus. So nennt er das Schiff. Er trägt das Schiff.' },
  { id: 'villa', kenn: 'B-O12', name: 'Villa Seiler', x: -111, z: 60.5, bonus: 1, text: 'ACHT SCHLÖSSER AUS EISEN. DER DOKTOR WUSSTE DASS ICH DA NICHT DURCHKOMME.\nER HAT MICH EINMAL FOTOGRAFIERT. NACHTS. DAS BILD HAT LÄNGER ALS EINE SEKUNDE GEBRAUCHT.\nDRAUF WAR NUR EIN BAUM. ER HAT ES VERBRANNT UND EIN ANDERES IN DIE ZEITUNG GEGEBEN.\nICH HAB DEN REST.' },
  { id: 'lichtung', kenn: 'B-O13', name: 'Lichtung', x: 4, z: 110.5, text: 'DER WALD HAT KEIN ECHO.\nRUF MAL.\n… NEIN. LIEBER NICHT.' },
  { id: 'huette', kenn: 'B-O14', name: 'Zayns Hütte', x: 55, z: 146.5, text: 'ZAYN HAT HIER GEZEICHNET. MICH AUCH.\nER HAT MICH GRÖSSER GEMALT ALS ICH BIN. MIT EINEM SCHWERT.\nKINDER MACHEN DAS MIT DINGEN VOR DENEN SIE KEINE ANGST HABEN.\nDAS BILD HAB ICH HIERGELASSEN. ES GEHÖRT HIERHER.' },
  { id: 'hochsitz', kenn: 'B-O15', name: 'Hochsitz', x: 16.2, z: 176.2, bonus: 2, text: 'DU HAST ES GEFUNDEN. ZWEI FÜR DEINE LAMPE.\nOBEN SITZT MANCHMAL EINER IM SCHLAFANZUG UND GUCKT ZU EUREN LICHTERN.\nICH SETZ MICH NICHT DAZU. ER WÜRDE MICH ANGUCKEN UND DANN WÄR ICH WEG.\nER GUCKT GERN HIN. WIE DU.' },
  { id: 'bus', kenn: 'B-O16', name: 'Amtsbus', x: 60.8, z: 196.2, bonus: 2, text: 'SIEBEN SITZE FÜR KINDER. EINEN HAB ICH MIR GENOMMEN ALS KEINER HINSAH.\nUNTER MEINEM SITZ STEHT WAS ICH EINGEMACHT HAB. GUCKEN DARFST DU. NICHT AUFMACHEN.\nDIE SCHWEINE HABEN AUF DEIN GESCHENK AUFGEPASST.' },
  { id: 'steinkreis', kenn: 'B-O17', name: 'Steinkreis', x: 15, z: 231.2, text: 'DIE STEINE SIND ÄLTER ALS EUER DORF. WER SIE HINGESTELLT HAT WOLLTE WIEDERKOMMEN.\nDER ACHTE STÖCKCHENMANN HÄNGT TIEFER. DEN HAB ICH NICHT GEMACHT. ICH WEISS ABER FÜR WEN.\nUNTER DEM GROSSEN STEIN SCHLÄFT MEINE SCHWESTER. NICHT GRABEN.',
    zwei: 'DIE STEINE SIND ÄLTER ALS EUER DORF. WER SIE HINGESTELLT HAT WOLLTE WIEDERKOMMEN.\nDER ACHTE STÖCKCHENMANN HÄNGT TIEFER. DEN HAB ICH NICHT GEMACHT. ICH WEISS ABER FÜR WEN.\nUNTER DEM GROSSEN STEIN SCHLAFEN ZWEI. WEGEN DIR. NICHT GRABEN.' },
  { id: 'wrack', kenn: 'B-O18', name: 'Autowrack', x: -6.2, z: 201.5, bonus: 1, text: 'HINTER DEM WRACK WOHNT WAS FRISST.\nFRÜHER HAT ES HINTER UNS AUFGERÄUMT. JETZT GEHÖRT ES KEINEM.\nES HAT ANGST VOR DEM VOGEL. VOR MIR NICHT. DENK DRÜBER NACH.' },
  { id: 'weiher', kenn: 'B-O19', name: 'Weiher', x: 43, z: 245.4, text: 'DER WEIHER HAT KEINEN GRUND. ICH HAB ES GEPRÜFT. MIT EINEM SEHR LANGEN STOCK.\nJONAS HAT DAS ENDE DER WOLLE REINGEHÄNGT. JEMAND HAT DRAN GEZOGEN.\nNICHT ICH. ICH ZIEH NIE AN WAS.' },
];
const BEOB_WALD = { lichtung: 1, huette: 1, hochsitz: 1, bus: 1, steinkreis: 1, wrack: 1, weiher: 1 }; // Orte in den Dustwoods (PK-A A29)
const BEOB_FINAL = 'NEUNZEHN ORTE. DU WARST AN ALLEN. ICH AUCH. JEDES MAL MIT DIR. MEISTENS VORHER.\nSEIT SIE WIEDER DA IST STELL ICH MICH NACHTS AN DIE KREUZUNG. GANZ HINTEN.\nHILDE HAT MICH MITGEZÄHLT. SIE HAT NIE GEFRAGT WER DER NEUNTE IST.\nDU FRAGST AUCH NICHT. NOCH NICHT.';
function beob_obj() { const el = document.getElementById('objText'); return el ? el.textContent : ''; }
function beob_desc() { const q = story.side.beobachter; if (!q) return; const n = BEOB_ORTE.filter(o => beob_S.found.has(o.id)).length;
  q.title = 'Der Neunte';
  q.desc = beob_S.done ? 'Neunzehn Orte. Er war an jedem vor dir.' : beob_ch() < 3 && !n ? 'Jemand hat einen Zettel hinterlassen. Bleistift, Druckbuchstaben, drei Punkte. Er zählt.'
    : `Jemand Kleines folgt dir und legt Zettel aus, gezeichnet „∴“. Hilde hat ihn mitgezählt. Zettel an Orten: ${n} / ${BEOB_ORTE.length}.`; }
function beob_side() { if (!story.side.beobachter) story.side.beobachter = { title: 'Der Neunte', desc: '', state: 'hidden' }; if (story.side.beobachter.state === 'hidden') sideStart('beobachter'); beob_desc(); }
// ---------------------------------------------------------------- Papier im Spiel (blassblau kariert, oben abgerissen, Bleistift, ∴)
let beob_paperMat = null;
function beob_paper() {
  if (beob_paperMat) return beob_paperMat;
  const c = cnv(256, (x, w) => { x.clearRect(0, 0, w, w); x.save(); x.beginPath(); x.moveTo(0, w); x.lineTo(0, 14); for (let i = 0; i <= 16; i++) x.lineTo(i * w / 16, 10 + (i % 2 ? 6 : 0) + Math.random() * 5); x.lineTo(w, w); x.closePath(); x.clip();
    x.fillStyle = '#e8e5da'; x.fillRect(0, 0, w, w); const g = x.createRadialGradient(w * .7, w * .8, 10, w * .6, w * .6, w * .8); g.addColorStop(0, 'rgba(140,120,90,.14)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w);
    x.strokeStyle = 'rgba(90,125,175,.28)'; x.lineWidth = 1; for (let i = 8; i < w; i += 11) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, w); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
    x.fillStyle = 'rgba(58,58,66,.85)'; for (let l = 0; l < 6; l++) { let px = 24; const py = 44 + l * 30; while (px < w - 44) { const lw = rand(6, 10); x.save(); x.translate(px, py); x.rotate(rand(-.08, .08)); x.fillRect(0, rand(-1, 1), lw, rand(10, 13)); x.restore(); px += lw + rand(3, 6); if (Math.random() < .14) px += 9; } }
    x.font = 'bold 34px serif'; x.fillStyle = 'rgba(50,50,58,.9)'; x.fillText('∴', w - 62, w - 22); x.restore(); });
  const t = tex(c, true); beob_paperMat = new THREE.MeshStandardMaterial({ map: t, roughness: .92, alphaTest: .5, side: THREE.DoubleSide }); return beob_paperMat;
}
function beob_note(x, y, z, open) { const m = new THREE.Mesh(beob_S.noteGeo || (beob_S.noteGeo = new THREE.PlaneGeometry(.15, .2)), beob_paper()); m.rotation.set(-PI / 2, 0, rand(-PI, PI)); m.position.set(x, y + .012, z); m.receiveShadow = true; scene.add(m);
  const hit = box(.7, .45, .7, x, y + .2, z, hidden, { cast: false }); interact(hit, 'Zettel', open); return { m, hit }; }
function beob_hideSpot(n) { if (n.m) n.m.visible = false; if (n.hit) uninteract(n.hit); n.gone = true; }
function beob_read(title, text, key, items, o = {}) { Audio.paper(); openNote(title, beob_html(beob_fill(text), o), key, o.onClose);
  if (items && beob_ch() === 6 && typeof tief_S !== 'undefined' && tief_S.inside) { const c = beob_S.c; items = Math.max(0, Math.min(items, 3 - (c.batt6 || 0))); c.batt6 = (c.batt6 || 0) + items; } // Kap. 6: höchstens drei im tiefen Wald (A-30)
  if (items) setTimeout(() => addBattery(items), 600); }
function beob_firstThought() { if (typeof gedanke !== 'function') return; gedanke('beob_1', 'Druckbuchstaben. Bleistift. Und dieses Zeichen: drei Punkte. … Wer schreibt so? Und woher weiß er das?', 1800, 3); }
function beob_readSpot(n) {
  const S = beob_S; if (n.gone) return; const first = !S.found.size && !S.given.size; S.found.add(n.id); beob_hideSpot(n);
  const bonus = n.bonus && S.bonus.has(n.id) ? n.bonus : (n.bonus && !BEOB_DYN.some(d => d.cache === n.id) ? n.bonus : 0);
  const text = n.id === 'steinkreis' && S.given.has('b_k4_06b') ? n.zwei : n.text;
  beob_read('Ein Zettel · ' + n.name, text, 'beob_ort_' + n.id, bonus || 0, { onClose: () => { if (n.luke && typeof gedanke === 'function') gedanke('beob_' + n.id, n.luke, 600, 3); } });
  if (n.rh && ch3.armorHints) ch3.armorHints.add(n.rh);
  beob_side(); if (first) beob_firstThought();
  if (!S.done && BEOB_ORTE.every(o => S.found.has(o.id))) { S.done = true; setTimeout(() => beob_drop(BEOB_FINAL_D, { hinter: true }), 1200); } // kommt hinter Luke an, nicht am Ort
  if (typeof saveGame === 'function') saveGame(beob_ch());
}
const BEOB_FINAL_D = { id: 'final', title: 'Neunzehn Orte', kind: 'final', item: 3, text: BEOB_FINAL, final: true };
// ---------------------------------------------------------------- Zettel legen: hinter Luke (Papier, Trippeln weg) · vor Luke · aus dem Lüftungsgitter (Kap. 2) · an einer Stelle
function beob_platz(wo) {
  const P = player.pos; camera.getWorldDirection(fwd); const fx = fwd.x, fz = fwd.z, fl = Math.hypot(fx, fz) || 1, a0 = Math.atan2(fx / fl, fz / fl);
  for (let k = 0; k < 16; k++) {
    let a, r; if (wo === 'hinter') { a = a0 + PI + rand(-.6, .6); r = rand(1.8, 3.4); } else { a = a0 + rand(-.35, .35); r = rand(1.3, 2.3); }
    const x = P.x + Math.sin(a) * r, z = P.z + Math.cos(a) * r; const f = beob_facing(x, P.y, z);
    if (wo === 'hinter' && f > .1) continue; if (wo !== 'hinter' && f < .75) continue; if (!beob_free(x, z) || beob_eisen(x, z, .6)) continue;
    const gy = beob_gy(x, z); if (Math.abs(gy - P.y) > .35) continue; return [x, gy, z]; }
  return null;
}
function beob_drop(d, o = {}) {
  const S = beob_S, P = player.pos; if (!d || (S.given.has(d.id) && !o.nochmal)) return false;
  const wo = o.pos ? 'pos' : o.gitter || d.wo === 'gitter' && !o.hinter ? 'gitter' : o.vor || d.wo === 'vor' ? 'vor' : 'hinter';
  const spot = o.pos ? [o.pos[0], o.pos[1] ?? beob_gy(o.pos[0], o.pos[2]), o.pos[2]] : beob_platz(wo === 'hinter' ? 'hinter' : 'vor'); if (!spot) return false;
  S.given.add(d.id); if (d.statt) S.given.add(d.statt); if (d.id === 'b_k3_05') S.given.add('b_k3_05b'); const [x, y, z] = spot;
  let text = d.text; if (d.variante) { try { text += d.variante() || ''; } catch (e) {} }
  const N = beob_note(x, y, z, () => { beob_hideSpot(N); const i = S.notes.indexOf(N); if (i >= 0) S.notes.splice(i, 1); if (d.cache) S.bonus.add(d.cache);
    const title = d.kind === 'raetsel' ? 'Ein Zettel · Rätsel' : d.kind === 'frage' ? 'Ein Zettel · Frage' : d.title ? 'Ein Zettel · ' + d.title : 'Ein Zettel';
    let tx = text; if (d.rueck) { try { const r = d.rueck(); if (r) tx += '\n\n<small style="opacity:.75">(RÜCKSEITE)</small>\n' + r; } catch (e) {} }
    beob_read(title, tx, 'beob_' + d.id, d.item || 0, { k: d.k, onClose: () => beob_nachLesen(d) });
    if (d.rh && ch3.armorHints) ch3.armorHints.add(d.rh);
    if (d.final) { addItem('murmel'); sideDone('beobachter', 'Neunzehn Orte. Er war an jedem vor dir.'); beob_desc(); if (typeof gedanke === 'function') gedanke('beob_final', 'Der Neunte. Hilde hat neun gezählt, und keiner hat ihr geglaubt. … Er war die ganze Zeit da. Und er will, dass ich es weiß.', 2500, 3); }
    if (!S.given.has('_t')) { S.given.add('_t'); if (!S.found.size) beob_firstThought(); } beob_side();
    if (d.sad) S.sadUntil = S.t + d.sad; if (typeof saveGame === 'function') saveGame(beob_ch()); });
  S.notes.push(N); S.lastNoteT = S.t;
  if (wo === 'gitter') { const top = (state.zone === 'canal' ? 3 : C2.h) - .06; N.m.position.y = top; N.m.rotation.set(-PI / 2 + rand(-.6, .6), rand(-.4, .4), rand(-PI, PI)); N.m.visible = true;
    S.falling.push({ m: N.m, x, y: y + .012, z, t: 0, T: 1.5 + Math.random() * .4, y0: top, s: rand(0, 6), rz: N.m.rotation.z }); Audio.play('metalHit1', { gain: .05, rate: 2.1, x, y: top, z, ref: 2 });
    setTimeout(() => { beob_scrapeAway(x, z); }, 1700); }
  else if (!d.leise) { Audio.paper(); if (wo === 'hinter') setTimeout(() => { beob_patter(x, z, 4, 1); beob_rustle(x + rand(-3, 3), z + rand(-3, 3), .5); }, 350); }
  if (d.bonbon) beob_spur('bonbon', { pos: [x + .12, y, z + .1], nie: true });
  if (d.spur === 'kiesel') beob_spur('kiesel', { pos: [x + rand(-.5, .5), y, z + rand(-.5, .5)] });
  if (d.spur === 'bonbon') beob_spur('bonbon', { pos: [x + .14, y, z - .08] });
  if (typeof hintAdd === 'function') hintAdd({ id: 'beob_' + d.id, x, y, z, kind: 'geheim', near: 12, open: () => !N.gone });
  if (wo === 'hinter' && typeof gedanke === 'function') gedanke('beob_hinter', 'Papier. Direkt hinter mir. … Da lag eben noch nichts.', 900, 2);
  beob_evt('papier'); if (typeof saveGame === 'function') saveGame(beob_ch()); return true;
}
function beob_nachLesen(d) {
  const S = beob_S; if (typeof gedanke === 'function') { if (d.luke) gedanke('beob_l_' + d.id, d.luke, 700, 3); if (d.luke2) gedanke('beob_l2_' + d.id, d.luke2, 3200, 3); }
  if (d.nach === 'decke') setTimeout(() => beob_scrapeAway(player.pos.x, player.pos.z), 2600);
  // Lesepause: manchmal liegt danach ein Gegenstand anders (Dossier 3.2 „Luke liest“)
  if (S.t - (S.gh.lese || -999) > 240 && Math.random() < .35 && !beob_traurig() && (typeof spannung_since !== 'function' || spannung_since('peak') > 90) && (typeof spannung_can !== 'function' || spannung_can('beob_gh', 'minor'))) { if (beob_ghVerschieben(true)) { S.gh.lese = S.t; if (typeof spannung_did === 'function') spannung_did('beob_gh', 'minor'); } }
}
function beob_findDyn(id) { const k = String(id).toLowerCase().replace(/-/g, '_'); return BEOB_DYN.find(d => d.id === k) || (k === 'final' ? BEOB_FINAL_D : null); }
function beobachter_zettel(id, o = {}) { const d = beob_findDyn(id); if (!d) { console.warn('Beobachter: Zettel unbekannt', id); return false; } return beob_drop(d, o); }
function beob_nextNote() {
  const S = beob_S, k = beob_ch(), mode = beob_mode(), stuck = beob_stuck();
  if (k >= 2 && mode !== 'klang' && FLASH.spare <= 0 && FLASH.charge < .25 && !(typeof hunt !== 'undefined' && hunt.on) && !S.given.has('d_not_' + k))
    return Object.assign({}, BEOB_NOT, { id: 'd_not_' + k, text: k === 6 ? BEOB_NOT6 : BEOB_NOT.text });
  if (k <= 1) return null; // Kapitel 1: Zettel nur per Skript
  const open = BEOB_DYN.filter(d => !d.script && d.when && !S.given.has(d.id) && k >= d.k && k <= (d.bis || d.k) && (() => { try { return d.when(); } catch (e) { return false; } })());
  return (stuck && open.find(d => d.stuck)) || open.find(d => !d.stuck) || null;
}
// ---------------------------------------------------------------- Klänge (vorhandene Aufnahmen + synthetisch: Atmen, Papierreißen, Bleistift, Bonbon)
function beob_rustle(x, z, v = 1) { if (!Audio.ctx) return; const d = Audio.at(x, .5, z, 3), n0 = rand(3, 6);
  for (let i = 0; i < n0; i++) { const n = Audio.noise(false), bp = Audio.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(1800, 4200); bp.Q.value = .9; n.connect(bp); Audio.env(bp, rand(.05, .11) * v, .01, rand(.05, .14), i * rand(.05, .12), d); n.stop(Audio.ctx.currentTime + 1.5); } }
function beob_patter(x, z, n = 4, v = 1, y = 0) { const a = rand(0, 6.28), dx = Math.cos(a) * .35, dz = Math.sin(a) * .35;
  for (let i = 0; i < n; i++) setTimeout(() => Audio.play(Audio.pick('stepG1', 'stepG2', 'stepG3'), { gain: .09 * v, rate: rand(1.7, 2.1), x: x + i * dx, y, z: z + i * dz, ref: 2 }), i * rand(80, 120)); }
function beob_chirp(x, z, y = .7) { if (!Audio.ctx) return; const d = Audio.at(x, y, z, 3), t = Audio.ctx.currentTime;
  for (let k = 0; k < 2; k++) { const o = Audio.ctx.createOscillator(), g = Audio.ctx.createGain(); o.type = 'sine'; const t0 = t + k * .16; o.frequency.setValueAtTime(1500 + k * 180, t0); o.frequency.exponentialRampToValueAtTime(2300 + k * 200, t0 + .08); o.frequency.exponentialRampToValueAtTime(1700, t0 + .14);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.022, t0 + .02); g.gain.linearRampToValueAtTime(0, t0 + .14); o.connect(g); g.connect(d); o.start(t0); o.stop(t0 + .16); } }
function beob_atem(x, z, y = .75, n = 0) { // kurzes, schnelles Kinder-Atmen nach dem Rennen: 3–5 Züge, hoch gefiltert, ganz leise (unter dem Wind)
  if (!Audio.ctx) return; const ctx = Audio.ctx, d = Audio.at(x, y, z, 1.4), N = n || Math.round(rand(3, 5)); let t = 0;
  for (let i = 0; i < N; i++) { for (const [pk, a, dc, f] of [[.045, .16, .14, rand(1500, 2100)], [.06, .05, .24, rand(1100, 1600)]]) { const s = Audio.noise(false), bp = ctx.createBiquadFilter(), hp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = .8; hp.type = 'highpass'; hp.frequency.value = 650; s.connect(bp); bp.connect(hp); Audio.env(hp, pk * rand(.8, 1.1), a, dc, t, d); s.stop(ctx.currentTime + t + 1); t += a + dc * .8; }
    t += rand(.05, .14); }
}
function beob_reissen(x, z, y = .6) { // Notizblockblatt, das abgerissen wird: viele kleine Faser-Knackser, dann der Riss
  if (!Audio.ctx) return; const ctx = Audio.ctx, d = Audio.at(x, y, z, 2);
  for (let i = 0; i < 26; i++) { const s = Audio.noise(false), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(2400, 6500); bp.Q.value = rand(2, 5); s.connect(bp); Audio.env(bp, rand(.03, .08), .002, rand(.008, .03), i * .014 + rand(0, .01), d); s.stop(ctx.currentTime + 1); }
  const s = Audio.noise(false), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 1.2; s.connect(bp); Audio.env(bp, .07, .01, .09, .38, d); s.stop(ctx.currentTime + 1);
}
function beob_bleistift(x, z, dur = 8) { // Schreiben auf Papier, das auf einem Knie liegt: Striche, Absätze, 7–10 s
  if (!Audio.ctx) return; const ctx = Audio.ctx, d = Audio.at(x, .45, z, 2.2); let t = 0;
  while (t < dur) { const L = rand(.05, .2), s = Audio.noise(false), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(3000, 5200); bp.Q.value = rand(3, 6); s.connect(bp); Audio.env(bp, rand(.018, .03), .008, L, t, d); s.stop(ctx.currentTime + t + L + .3);
    t += L + rand(.03, .1); if (Math.random() < .12) t += rand(.3, .7); }
}
function beob_bonbon(x, y, z) { // ein Bonbon klackt gegen Zähne (es gibt keine Zähne)
  if (!Audio.ctx) return; const ctx = Audio.ctx, d = Audio.at(x, y, z, 1.6);
  for (const t0 of [0, .21]) { const o = Audio.osc('sine', rand(2600, 3100), t0, .05); o.frequency.exponentialRampToValueAtTime(1900, ctx.currentTime + t0 + .03); Audio.env(o, .05, .001, .03, t0, d);
    const s = Audio.noise(false), hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3500; s.connect(hp); Audio.env(hp, .04, .001, .015, t0, d); s.stop(ctx.currentTime + t0 + .2); }
  const s = Audio.noise(false), lp = ctx.createBiquadFilter(); lp.type = 'bandpass'; lp.frequency.value = 900; lp.Q.value = 2; s.connect(lp); Audio.env(lp, .018, .05, .2, .38, d); s.stop(ctx.currentTime + 1);
  beob_evt('bonbon');
}
function beob_zaun(x, z) { Audio.play(Audio.pick('woodSqueak1', 'woodSqueak2'), { gain: .07, rate: rand(1.3, 1.6), x, y: .8, z, ref: 3 }); Audio.play(Audio.pick('woodSqueak1', 'woodSqueak2'), { gain: .035, rate: rand(1.5, 1.8), x, y: .8, z, ref: 3, delay: rand(.6, .9) }); }
function beob_klopf(x, y, z, v = 1) { for (let i = 0; i < 6; i++) Audio.play(Audio.pick('metalHit1', 'metalHit2'), { gain: .055 * v, rate: rand(1.8, 2.05), x, y, z, ref: 2.5, delay: (i < 3 ? i * .2 : 1.25 + (i - 3) * .2) }); } // ∴: drei, Pause, drei
function beob_scrapeAway(x, z) { camera.getWorldDirection(fwd); const a = Math.atan2(fwd.x, fwd.z) + rand(-1, 1);
  for (let i = 0; i < 4; i++) Audio.play(Audio.pick('scrape1', 'scrape2', 'scrape3', 'scrape4'), { gain: .1 - i * .02, rate: rand(1.7, 2.2), x: x + Math.sin(a) * (2 + i * 2.2), y: 2.4, z: z + Math.cos(a) * (2 + i * 2.2), ref: 2.5, delay: i * .75 }); }
function beob_evt(fam) { const S = beob_S; S.quietT = 0; S.fam.push([S.t, fam]); if (S.fam.length > 60) S.fam.shift(); S.lastFam = fam; S.test.snd[fam] = (S.test.snd[fam] || 0) + 1;
  if (typeof spannung_did === 'function') { try { spannung_did('beob', 'beob'); } catch (e) {} } } // nur Gedächtnis/Protokoll der Regie – belegt kein Umgebungsbudget
function beob_famN(fam, win = 600) { const S = beob_S; let n = 0; for (const e of S.fam) if (e[1] === fam && S.t - e[0] < win) n++; return n; }
// Position um Luke: meist hinter ihm oder seitlich, nie zweimal auf derselben Seite (Dossier 3.3)
function beob_umLuke(r0, r1, hinten = true) { const S = beob_S, P = player.pos; camera.getWorldDirection(fwd); const a0 = Math.atan2(fwd.x, fwd.z); S.side = -S.side;
  for (let k = 0; k < 10; k++) { const a = a0 + PI * (hinten ? 1 : 0) + S.side * rand(.25, 1.35), r = rand(r0, r1), x = P.x + Math.sin(a) * r, z = P.z + Math.cos(a) * r; if (!beob_eisen(x, z, .8)) return [x, z]; }
  return [P.x + Math.sin(a0 + PI) * r1, P.z + Math.cos(a0 + PI) * r1]; }
function beob_sound(force) {
  const S = beob_S, st = S.stat, mode = beob_mode(), k = beob_ch(), P = player.pos, dark = !flashOn || state.flashFail > .5 || FLASH.charge <= 0;
  if (mode === 'klang') { // Kapitel 1: selten, nie näher als 12 m, keine Schritte direkt hinter Luke
    if (beob_indoor()) return false; const [x, z] = beob_umLuke(BEOB.k1Min, BEOB.k1Min + 12); S.a.x = x; S.a.z = z; beob_setVp(x, beob_gy(x, z), z);
    const pool = ['rustle', 'twig', 'patter', 'stones', 'chirp'].filter(f => f !== S.lastFam && beob_famN(f) < 4), f = pool[Math.floor(Math.random() * pool.length)] || 'rustle';
    if (f === 'rustle') beob_rustle(x, z, .9); else if (f === 'twig') Audio.twig ? Audio.twig(x, z) : Audio.play('woodCrack', { gain: .13, rate: 1.6, x, y: 0, z, ref: 3 });
    else if (f === 'patter') beob_patter(x, z, 4, .8); else if (f === 'stones') Audio.play('stones1', { gain: .09, rate: rand(1.5, 1.9), x, y: 0, z, ref: 3 }); else beob_chirp(x, z);
    beob_evt(f); return true; }
  if (mode === 'decke') { // Kapitel 2 / Kanal: über der Decke, etwa zwei Meter über Luke und ein Stück voraus
    const fuse = ch2.on && beob_in(C2.x + 30, C2.x + 36, C2.z + 2, C2.z + 8); if (fuse && !ch2.power) return false; // im Sicherungsraum schweigt er, bis der Strom da ist
    camera.getWorldDirection(fwd); const ahead = rand(.8, 3), sx = rand(-1.2, 1.2), x = P.x + fwd.x * ahead + fwd.z * sx, z = P.z + fwd.z * ahead - fwd.x * sx, y = (state.zone === 'canal' ? 3.2 : C2.h) + .2; S.a.x = x; S.a.z = z; beob_setVp(x, y, z);
    const still = st.still > 3, pool = still ? ['drip', 'scrape', 'klopf'] : ['scrape', 'scrape', 'klopf', 'patter', 'chirp'];
    let f = pool.filter(q => q !== S.lastFam && beob_famN(q) < 5)[0]; f = pool[Math.floor(Math.random() * pool.length)]; if (f === S.lastFam) f = f === 'scrape' ? 'patter' : 'scrape';
    if (f === 'scrape') Audio.play(Audio.pick('scrape1', 'scrape2', 'scrape3', 'scrape4'), { gain: .11, rate: rand(1.6, 2.2), x, y, z, ref: 3 });
    else if (f === 'klopf') beob_klopf(x, y, z); else if (f === 'patter') beob_patter(x, z, 3, .7, y);
    else if (f === 'drip') { const [bx, bz] = beob_umLuke(1.5, 3); Audio.drip(bx, 1.4, bz); } else beob_chirp(x, z, y);
    beob_evt(f); return true; }
  // ab Kapitel 3
  const day = k === 4 && !beob_indoor(), still = st.still > 3, r = dark ? [5, 10] : day ? [12, 22] : [7, 16];
  const [x, z] = beob_umLuke(r[0], r[1]); S.a.x = x; S.a.z = z; beob_setVp(x, beob_gy(x, z), z);
  if (S.paperFirst) { S.paperFirst = false; if (beob_papier(x, z)) return true; } // nach Stille oder Schreck: das erste Geräusch ist immer ein freundliches
  const c = S.c, pool = [];
  const add = (f, w) => { if (f !== S.lastFam && beob_famN(f) < 4) for (let i = 0; i < w; i++) pool.push(f); };
  if (beob_indoor()) { add('scrape', 3); add('patter', 3); add('drip', 1); add('chirp', 1); add('klopf', 1); }
  else { add('rustle', 4); add('twig', 2); add('patter', 3); add('stones', 2); add('metal', 1); add('chirp', 1); add('zaun', 1);
    if (c.bleistift < 2 && !day) add('bleistift', 1); if (k >= 5 && c.bonbon < 1) add('bonbon', 1); if (c.papierLeer < 1) add('papierleer', 1);
    if ((st.still > 20 || dark) && c.atem < 2 && !(typeof hunt !== 'undefined' && hunt.on)) add('atem', still ? 3 : 1); }
  if (!pool.length) { S.test.snd.gewoehnt = (S.test.snd.gewoehnt || 0) + 1; return false; } // alles abgenutzt: lieber still (5.7)
  const f = pool[Math.floor(Math.random() * pool.length)];
  if (f === 'rustle') beob_rustle(x, z, 1); else if (f === 'twig') Audio.twig ? Audio.twig(x, z) : Audio.play('woodCrack', { gain: .15, rate: 1.6, x, y: 0, z, ref: 3 });
  else if (f === 'patter') beob_patter(x, z, 4); else if (f === 'stones') Audio.play('stones1', { gain: .1, rate: rand(1.5, 1.9), x, y: 0, z, ref: 3 });
  else if (f === 'metal') Audio.play(Audio.pick('metalHit1', 'metalHit2'), { gain: .045, rate: rand(1.8, 2.2), x, y: .1, z, ref: 2 }); else if (f === 'chirp') beob_chirp(x, z);
  else if (f === 'zaun') beob_zaun(x, z); else if (f === 'scrape') Audio.play(Audio.pick('scrape1', 'scrape2', 'scrape3', 'scrape4'), { gain: .09, rate: rand(1.6, 2.2), x, y: 2.3, z, ref: 3 });
  else if (f === 'drip') Audio.drip(x, 1.6, z); else if (f === 'klopf') beob_klopf(x, 1.2, z, .7);
  else if (f === 'bleistift') { const [hx, hz] = beob_umLuke(6, 10, false); beob_bleistift(hx, hz, rand(7, 10)); c.bleistift++; if (typeof gedanke === 'function') gedanke('beob_bleistift', 'Er schreibt. Ich hör ihn schreiben. Über mich. Sehr gut. Rezension.', 4500, 2); }
  else if (f === 'bonbon') { beob_bonbon(x, .7, z); c.bonbon++; }
  else if (f === 'papierleer') { beob_reissen(x, z); c.papierLeer++; } // Reißen, aber kein Zettel: er hat sich anders entschieden (einmal je Kapitel)
  else if (f === 'atem') { const [bx, bz] = beob_umLuke(4.2, 7); beob_atem(bx, bz); c.atem++; beob_setVp(bx, beob_gy(bx, bz), bz); }
  beob_evt(f); return true;
}
function beob_papier(x, z) { const S = beob_S, d = beob_nextNote(); beob_reissen(x, z); if (d) { setTimeout(() => { if (beob_mode() !== 'aus' && !beob_quiet()) { beob_drop(d); S.noteT = rand(BEOB.gap[0], BEOB.gap[1]); } }, 4000); } else S.c.papierLeer++; beob_evt('papier'); return true; }
// ---------------------------------------------------------------- Das Modell: Wachs mit Licht dahinter, feucht, Augen wie nasser Stein
function beob_haut(img) { // Textur des Modells: Pastell raus (Lila/Rosa/Türkis → perlgrau mit Adern), Augen ganz dunkel ohne Weiß, feine Fleckung
  const W = 1024, c = document.createElement('canvas'); c.width = c.height = W; const x = c.getContext('2d'); x.drawImage(img, 0, 0, W, W);
  const id = x.getImageData(0, 0, W, W), d = id.data, sc = W / 2048;
  const eyes = [[1810, 300, 158, 128], [228, 1321, 128, 166]].map(e => e.map(v => v * sc));
  for (let py = 0; py < W; py++) for (let px = 0; px < W; px++) {
    const i = (py * W + px) * 4; let r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx - mn, lum = r * .3 + g * .59 + b * .11;
    let eye = 0; for (const [ex, ey, rx, ry] of eyes) { const q = Math.hypot((px - ex) / rx, (py - ey) / ry); eye = Math.max(eye, 1 - Math.min(1, Math.max(0, (q - .9) / .16))); }
    if (sat > .03 && eye < 1) { const k = Math.min(1, (sat - .03) / .08); const L = lum * .82 + .1; r = r * (1 - k) + L * .9 * k; g = g * (1 - k) + L * .91 * k; b = b * (1 - k) + L * .97 * k; } // Pastell → blasses Blaugrau (Adern bleiben als Schatten)
    if (eye <= 0 && py > 340 * sc && lum > .2 && lum < .66) { const L = .8; r = g = b = L; } // Mund, Nasenpunkte, Brauenstriche weg (kein sichtbarer Mund)
    else if (eye <= 0) { let q = 9; for (const [ex, ey, rx, ry] of eyes) q = Math.min(q, Math.hypot((px - ex) / rx, (py - ey) / ry)); if (q < 1.4) { const dk = 1 - .22 * (1 - (q - 1) / .4); r *= dk; g *= dk; b *= dk * 1.02; } } // eingesunkene Augenhöhlen
    r = r * .96 + .015; g = g * .955 + .012; b = b * .95 + .02; // Wachston
    if (eye > 0) { const q = 1 - eye, dk = .018 + q * .04; r = r * q + dk * eye; g = g * q + (dk + .003) * eye; b = b * q + (dk + .01) * eye; }
    d[i] = r * 255; d[i + 1] = g * 255; d[i + 2] = b * 255; }
  x.putImageData(id, 0, 0);
  // feine Fleckung und Adern (bläulich, kaum sichtbar), außerhalb der Augen
  x.save(); x.globalCompositeOperation = 'multiply'; for (let i = 0; i < 260; i++) { const cx = rand(0, W), cy = rand(0, W), rr = rand(6, 40), g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, `rgba(${rand(200, 225) | 0},${rand(200, 222) | 0},${rand(215, 235) | 0},.35)`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }
  x.lineCap = 'round'; for (let i = 0; i < 90; i++) { let cx = rand(0, W), cy = rand(0, W); x.strokeStyle = `rgba(${rand(95, 130) | 0},${rand(110, 140) | 0},${rand(160, 190) | 0},${rand(.05, .12)})`; x.lineWidth = rand(.6, 1.8); x.beginPath(); x.moveTo(cx, cy);
    for (let s = 0; s < 6; s++) { const nx = cx + rand(-26, 26), ny = cy + rand(-26, 26); x.quadraticCurveTo((cx + nx) / 2 + rand(-8, 8), (cy + ny) / 2 + rand(-8, 8), nx, ny); cx = nx; cy = ny; } x.stroke(); }
  x.restore(); for (const [ex, ey, rx, ry] of eyes) { x.save(); x.globalCompositeOperation = 'source-over'; const g = x.createRadialGradient(ex, ey, 0, ex, ey, Math.max(rx, ry)); g.addColorStop(0, 'rgba(6,7,10,1)'); g.addColorStop(.82, 'rgba(10,11,15,1)'); g.addColorStop(1, 'rgba(10,11,15,0)');
    x.fillStyle = g; x.beginPath(); x.ellipse(ex, ey, rx * .95, ry * .95, 0, 0, 7); x.fill(); x.restore(); }
  return c;
}
async function beob_hautBild() { // Grundfarbe (JPEG) direkt aus der glb: das Material der geladenen Kopie kann eine GPU-/KTX2-Textur ohne zeichenbares Bild sein
  const buf = await (await fetch('assets/ms/beobachter/model.glb')).arrayBuffer(), dv = new DataView(buf), jl = dv.getUint32(12, true), J = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl)));
  const bin = 20 + jl + 8, mat = J.materials[0], ti = mat.pbrMetallicRoughness.baseColorTexture.index, im = J.images[J.textures[ti].source], bv = J.bufferViews[im.bufferView];
  return await createImageBitmap(new Blob([new Uint8Array(buf, bin + (bv.byteOffset || 0), bv.byteLength)], { type: im.mimeType || 'image/jpeg' }));
}
async function beob_loadModel() {
  const S = beob_S; try { const src = await msModel('beobachter', 'model.glb'); const m = src.clone(true); const g = new THREE.Group(); g.add(msGround(msFit(m, BEOB.h, 'y'))); g.visible = false; g.userData.noCol = true; g.name = 'beobachter'; scene.add(g);
    let map0 = null; m.traverse(o => { if (o.isMesh && !map0) map0 = o.material.map; });
    let skin = null; if (map0) { try { const cv = beob_haut(await beob_hautBild()); skin = new THREE.CanvasTexture(cv); skin.flipY = map0.flipY; skin.colorSpace = THREE.SRGBColorSpace; skin.wrapS = map0.wrapS; skin.wrapT = map0.wrapT;
        skin.offset.copy(map0.offset); skin.repeat.copy(map0.repeat); skin.rotation = map0.rotation; skin.center.copy(map0.center); skin.channel = map0.channel; skin.anisotropy = 4; skin.needsUpdate = true; } catch (e) { console.warn('Beobachter: Haut', e); } }
    const uT = { value: 0 }, uLit = { value: 0 };
    const skinMat = new THREE.MeshPhysicalMaterial({ map: skin || map0, color: 0xf2efe8, roughness: .5, metalness: 0, clearcoat: .45, clearcoatRoughness: .32, sheen: .35, sheenRoughness: .6, sheenColor: new THREE.Color(0xdfe6f2), envMapIntensity: .45 });
    m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; o.material = skinMat; } }); g.updateMatrixWorld(true);
    { const bb = new THREE.Box3(), sz = new THREE.Vector3(); m.traverse(o => { if (!o.isMesh) return; bb.setFromObject(o).getSize(sz); if (Math.min(sz.x, sz.y, sz.z) < BEOB.h * .045 && Math.max(sz.x, sz.y, sz.z) < BEOB.h * .4) o.visible = false; }); } // Mundstrich/Punkt: kein sichtbarer Mund (Dossier §2)
    // Drehpunkte: Kopf am Hals, Körper an den Füßen (das Modell hat kein Skelett; die Gruppen liegen sonst auf dem Modell-Ursprung)
    const head0 = m.getObjectByName('Kopf'), body0 = m.getObjectByName('Koerper'), piv = (o, yk) => { if (!o) return null; const b = new THREE.Box3().setFromObject(o), c = b.getCenter(new THREE.Vector3()), p = new THREE.Group();
      p.position.set(c.x, b.min.y + (b.max.y - b.min.y) * yk, c.z); o.parent.worldToLocal(p.position); o.parent.add(p); p.updateMatrixWorld(true); p.attach(o); return p; };
    const headP = piv(head0, .06), bodyP = piv(body0, 0); g.updateMatrixWorld(true);
    // Fühler: nur die Eckpunkte oberhalb der Kopfkugel wippen (Shader), Stärke wächst zur Spitze; dazu Wachs-Schimmer am Rand und nasse, fast schwarze Augen
    const hm = []; (m.getObjectByName('kopf_Group28799') || head0 || m).traverse(o => { if (o.isMesh) hm.push(o); });
    const all = []; m.traverse(o => { if (o.isMesh) all.push(o); });
    for (const mesh of all) { const isAnt = hm.includes(mesh) && head0, mat = skinMat.clone(); let toHead = new THREE.Matrix4(), fromHead = new THREE.Matrix4(), base = 0, top = 0;
      if (isAnt) { toHead.copy(head0.matrixWorld).invert().multiply(mesh.matrixWorld); const P = mesh.geometry.attributes.position, v = new THREE.Vector3(); let bulb = -1e9; top = -1e9;
        for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(toHead); top = Math.max(top, v.y); if (Math.abs(v.x) < .012) bulb = Math.max(bulb, v.y); } fromHead.copy(toHead).invert(); base = bulb - .01; }
      mat.onBeforeCompile = sh => { sh.uniforms.uT = uT; sh.uniforms.uLit = uLit;
        if (isAnt) { sh.uniforms.uToHead = { value: toHead }; sh.uniforms.uFromHead = { value: fromHead }; sh.uniforms.uBase = { value: base }; sh.uniforms.uTop = { value: top };
          sh.vertexShader = 'uniform float uT, uBase, uTop; uniform mat4 uToHead, uFromHead;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          vec3 hp = (uToHead * vec4(position, 1.)).xyz; float k = smoothstep(uBase, uTop, hp.y); k *= k;
          vec3 off = vec3(sin(uT * 3.1 + hp.x * 30.) * .018 + sin(uT * 7.3) * .004, 0., cos(uT * 2.6 + hp.x * 22.) * .014) * k;
          transformed += (uFromHead * vec4(off, 0.)).xyz;`); }
        sh.fragmentShader = 'uniform float uT, uLit;\n' + sh.fragmentShader.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
          float beobEye = 1. - smoothstep(.035, .12, dot(diffuseColor.rgb, vec3(.3, .59, .11))); roughnessFactor = mix(roughnessFactor, .045, beobEye);`)
          .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          { float rim = pow(1. - clamp(abs(dot(normal, normalize(vViewPosition))), 0., 1.), 2.4);
            totalEmissiveRadiance += (vec3(.86, .9, 1.) * rim * .16 + diffuseColor.rgb * .035) * (1. - beobEye); }`); };
      mat.customProgramCacheKey = () => isAnt ? 'beob_fuehler2' : 'beob_haut2'; mesh.material = mat; }
    S.V = { g, m, head: headP, body: bodyP, uT, uLit, t: rand(0, 9), tilt: 0, tiltT: 0, jerk: 0, hy: 0, hyT: 0, by: 0, byT: 0, pitch: 0, lauf: 0 }; S.model = true;
  } catch (e) { console.warn('Beobachter: Modell', e); S.model = false; }
}
// Lebendig ohne Skelett: Atmung (Körper pumpt), Gewicht verlagert, Kopf legt sich schief und ruckt (hält dann still, zittert fein), Fühler wippen, geblendet dreht er weg
function beob_anim(dt, lit) { const V = beob_S.V; if (!V || !V.g.visible) return; V.t += dt; V.uT.value = V.t;
  const br = Math.sin(V.t * 2.7); if (V.body) V.body.scale.set(1 + br * .012, 1 + br * .02, 1 + br * .012);
  V.g.children[0].rotation.z = Math.sin(V.t * .8) * .018 + Math.sin(V.t * 1.9) * .006; // Gewicht verlagert
  V.tiltT -= dt; if (V.tiltT < 0) { V.tiltT = rand(.6, 2.2); V.tilt = Math.random() < .4 ? rand(-.5, .5) : rand(-.18, .18); V.hyT = rand(-.35, .35); V.jerk = .09; }
  if (V.jerk > 0) V.jerk -= dt; const kk = Math.min(1, dt * (V.jerk > 0 ? 38 : 2.2));
  if (V.head) { const tz = lit ? .15 : V.tilt, ty = lit ? -1.05 : V.hyT, tx = lit ? .32 : -.05 + br * .015;
    V.head.rotation.z += (tz - V.head.rotation.z) * kk; V.head.rotation.y += (ty - V.head.rotation.y) * (lit ? Math.min(1, dt * 9) : kk); V.head.rotation.x += (tx - V.head.rotation.x) * Math.min(1, dt * 6);
    V.head.rotation.z += Math.sin(V.t * 23) * .0025; }
  // Körper dreht ruckartig zu Luke (nie gleitend): erst wenn der Winkel groß wird, dann in 0,1 s
  const dx = player.pos.x - V.g.position.x, dz = player.pos.z - V.g.position.z, want = Math.atan2(dx, dz); let dif = want - V.g.rotation.y; dif = Math.atan2(Math.sin(dif), Math.cos(dif));
  if (Math.abs(dif) > .55 && V.byT <= 0) V.byT = .1; if (V.byT > 0) { V.byT -= dt; V.g.rotation.y += dif * Math.min(1, dt * 16); }
}
function beob_show(sp, fromHere) { const S = beob_S, V = S.V; V.g.position.set(sp[0], sp[1], sp[2]); V.g.rotation.set(0, Math.atan2(player.pos.x - sp[0], player.pos.z - sp[2]), 0); V.g.children[0].rotation.x = 0; V.g.visible = true; V.tiltT = rand(0, .4); V.byT = 0;
  beob_setVp(sp[0], sp[1], sp[2]); S.test.shown++; if (beob_ch() <= 1) S.test.k1Model++; }
function beob_hide() { const V = beob_S.V; if (V) V.g.visible = false; }
function beob_vanish(still) { const S = beob_S, V = S.V, p = V.g.position; V.g.visible = false; S.test.vanish++; if (!still) { beob_rustle(p.x, p.z, 1.2); beob_patter(p.x, p.z, 5); if (Math.random() < .4) beob_chirp(p.x, p.z); }
  S.c.vanish++; beob_evt('weg');
  if (typeof K6 !== 'undefined' && K6.on && /^(bau|epilog|hochsitz|oben)$/.test(K6.beat)) return; // Kapitel-6-Finale und Epilog: kein Gedanke, die Szene gehört dem Jungen und dem Raben
  if (typeof gedanke === 'function') { gedanke('beob_sehen', 'Da war was. Klein. Weiß. Große Augen. … Und jetzt ist es weg. Als hätte es gewusst, dass ich hinsehe.', 1200, 3);
    if (S.test.vanish >= 5) gedanke('beob_system', 'Okay. Wir haben ein System. Ich guck hin, du bist weg. Ich guck weg, du bist da. Das ist wie mit meinem Vermieter.', 1400, 2); } }
// ---------------------------------------------------------------- Verstecke: Baumstämme und kleine Deckungen (Autos, Tonnen, Grabsteine, Pfosten, Heuballen …), nie Eisen, nie frei
function beob_coversBau() { const S = beob_S, L = []; for (const c of colliders) { const hx = (c.maxX - c.minX) / 2, hz = (c.maxZ - c.minZ) / 2; if (!(hx > 0) || !(hz > 0)) continue; const mx = Math.max(hx, hz) * 2, mn = Math.min(hx, hz) * 2;
    if (mx < .24 || mx > 5 || mn < .12 || (c.top ?? 99) - (c.base ?? -1) < .6) continue; const cx = (c.minX + c.maxX) / 2, cz = (c.minZ + c.maxZ) / 2; if (Math.abs(cx) > 900 || Math.abs(cz) > 900) continue;
    try { if (leben_inHouse(cx, cz, .2)) continue; } catch (e) {} if (beob_eisen(cx, cz, .3)) continue; L.push([cx, cz, hx, hz]); }
  S.covers = L; S.coversKap = beob_ch(); }
function beob_peekSpot(minF, maxF, far = [14, 24]) {
  const S = beob_S, P = player.pos, trees = (typeof leben_S !== 'undefined' && leben_S.treePts) || [], cov = S.covers || [];
  for (let k = 0; k < 220; k++) { let x, z, ox = 0, oz = 0; const pick = Math.random();
    if (trees.length && pick < .5) { const [tx, tz] = trees[Math.floor(Math.random() * trees.length)], d = Math.hypot(tx - P.x, tz - P.z); if (d < far[0] || d > far[1]) continue; const fc = beob_facing(tx, P.y + .6, tz); if (fc < minF - .12 || fc > maxF + .12) continue;
      const side = Math.random() < .5 ? .34 : -.34, sx = (P.z - tz) / d * side, sz = -(P.x - tx) / d * side; x = tx + sx - (P.x - tx) / d * .1; z = tz + sz - (P.z - tz) / d * .1; ox = sx / .34 * .1; oz = sz / .34 * .1; }
    else if (cov.length) { const [cx, cz, hx, hz] = cov[Math.floor(Math.random() * cov.length)], d = Math.hypot(cx - P.x, cz - P.z); if (d < far[0] || d > far[1]) continue; const fc = beob_facing(cx, P.y + .6, cz); if (fc < minF - .15 || fc > maxF + .15) continue;
      const ux = (cx - P.x) / d, uz = (cz - P.z) / d, s = Math.random() < .5 ? 1 : -1, px = -uz * s, pz = ux * s, e = Math.abs(ux) * hx + Math.abs(uz) * hz, e2 = Math.abs(px) * hx + Math.abs(pz) * hz;
      x = cx + ux * (e + .24) + px * (e2 + .02); z = cz + uz * (e + .24) + pz * (e2 + .02); ox = px * .12; oz = pz * .12; }
    else continue;
    const T = S.test.pf || (S.test.pf = { f: 0, free: 0, gy: 0, los: 0, ok: 0 });
    const f = beob_facing(x, P.y + .6, z); if (f < minF || f > maxF) { T.f++; continue; } if (!beob_freeNah(x, z)) { T.free++; continue; } const gy = beob_gy(x, z); if (Math.abs(gy - P.y) > 2.5) { T.gy++; continue; }
    if (f > .3 && typeof hungrige_los === 'function' && !hungrige_los(x + ox, gy + BEOB.h * .74, z + oz)) { T.los++; continue; } T.ok++; return [x, gy, z]; }
  return null;
}
function beob_hinterDeckung(cx, cz, hx, hz, minF, maxF) { const P = player.pos, d = Math.hypot(cx - P.x, cz - P.z); if (d < 8 || d > 26) return null; const ux = (cx - P.x) / d, uz = (cz - P.z) / d; // erster Platz: halb hinter der Telefonzelle
  for (const s of [1, -1]) { const px = -uz * s, pz = ux * s, e = Math.abs(ux) * hx + Math.abs(uz) * hz, e2 = Math.abs(px) * hx + Math.abs(pz) * hz, x = cx + ux * (e + .2) + px * (e2 - .05), z = cz + uz * (e + .2) + pz * (e2 - .05);
    const f = beob_facing(x, P.y + .6, z); if (f >= minF && f <= maxF && !beob_eisen(x, z, .3)) return [x, beob_gy(x, z), z]; } return null; }
function beob_peekStart(sp, st = 'show') { beob_show(sp); beob_S.peek = { st, t: 0, seen: 0, vis: 0, n: 0, litE: false }; beob_rustle(sp[0], sp[2], .5); }
function beob_peekTick(dt) {
  const S = beob_S, V = S.V, K = S.peek; if (!V || !K) return; K.t += dt;
  if (K.st === 'show' || K.st === 'ruecken' || K.st === 'ganz') { const p = V.g.position, d = Math.hypot(player.pos.x - p.x, player.pos.z - p.z), f = beob_facing(p.x, p.y + BEOB.h * .7, p.z), inView = f > .62 && d < 60;
    const lit = flashOn && !state.blackout && FLASH.charge > 0 && d < 26 && f > .96; beob_anim(dt, lit);
    if (lit && !K.litE) { K.litE = true; S.c.lit++; S.lit = S.c.lit; } if (!lit) K.litE = false;
    if (K.st === 'ruecken') { if (f > .35) { if (!S.c.ganz && f < .7) { S.c.ganz = true; K.st = 'ganz'; K.t = 0; } else { beob_vanish(true); S.peek = null; beob_patter(p.x, p.z, 3, .6); return; } } else if (K.t > 25) { beob_hide(); S.peek = null; } return; }
    if (K.st === 'ganz') { if (inView) K.vis += dt; if (K.vis > .065 || K.t > 1.5 || f < .1) { beob_vanish(); S.peek = null; K.st = 'x'; } return; } // der eine Sechzehntel-Moment je Kapitel
    if (inView) { K.vis += dt; K.seen += dt * (f > .9 ? 1 : .75) * (lit ? 1.5 : 1); }
    if (K.seen >= BEOB.seenMax - Math.max(dt, .02) || K.vis >= BEOB.seenMax - Math.max(dt, .02) || d < BEOB.nah) { beob_vanish(); K.st = 'gone'; K.t = 0; K.wait = rand(2, 6); }
    else if (K.t > 40 && f < .3) { beob_hide(); S.peek = null; } }
  else if (K.st === 'gone') { if (K.t < K.wait) return; if (K.n >= 2 || beob_quiet() || beob_sperre() || beob_mode() !== 'voll') { S.peek = null; S.peekT = Math.max(S.peekT, rand(50, 90)); return; }
    // woanders wieder da: hinter Luke oder seitlich, außerhalb des Blickfelds, näher als vorher – man erwischt ihn beim Umdrehen am Rand
    const sp = beob_peekSpot(-.9, .15, [12, 22]); if (!sp) { S.peek = null; return; } K.n++; beob_show(sp); beob_rustle(sp[0], sp[2], .7); K.st = 'show'; K.t = 0; K.seen = 0; K.vis = 0; }
}
// ---------------------------------------------------------------- Gesetzte Sichtungen (AP-10 ruft das auf) und die Fast-Sichtung in Kapitel 2
function beob_sichtung(pos, dauer = .8, o = {}) {
  const S = beob_S, V = S.V; if (!V || beob_ch() <= 1) return false; if (S.peek) { beob_hide(); S.peek = null; }
  const weg = o.weg && o.weg.length > 1 ? o.weg : null, p0 = weg ? weg[0] : pos; beob_show([p0[0], p0[1] ?? beob_gy(p0[0], p0[2]), p0[2]]);
  if (o.blick) V.g.rotation.y = Math.atan2(o.blick[0] - p0[0], o.blick[2] - p0[2]); else if (weg) V.g.rotation.y = Math.atan2(weg[1][0] - p0[0], weg[1][2] - p0[2]);
  S.sicht = { t: 0, T: Math.min(dauer, o.lang ? 20 : 1), weg, ohren: !!o.ohren, still: !!o.still, next: 0 }; return true;
}
function beob_sichtTick(dt) { const S = beob_S, V = S.V, Q = S.sicht; if (!V || !Q) return; Q.t += dt; V.t += dt; V.uT.value = V.t;
  if (Q.weg) { const w = Q.weg, n = w.length - 1, u = Math.min(1, Q.t / Q.T) * n, i = Math.min(n - 1, Math.floor(u)), f = u - i, a = w[i], b = w[i + 1];
    const x = a[0] + (b[0] - a[0]) * f, z = a[2] + (b[2] - a[2]) * f, y0 = (a[1] ?? beob_gy(a[0], a[2])), y1 = (b[1] ?? beob_gy(b[0], b[2])); V.g.position.set(x, y0 + (y1 - y0) * f + Math.abs(Math.sin(Q.t * 19)) * .045, z); // Trippeln: kleine Sprünge, kein Gleiten
    V.g.rotation.y = Math.atan2(b[0] - a[0], b[2] - a[2]); V.g.children[0].rotation.x = .32; if (V.head) { V.head.rotation.x = .22; V.head.rotation.y = 0; } beob_setVp(x, y0, z);
    Q.next -= dt; if (Q.next < 0) { Q.next = .09; Audio.play(Audio.pick('stepG1', 'stepG2', 'stepG3'), { gain: .16, rate: rand(1.9, 2.2), x, y: 0, z, ref: 2.5 }); } }
  else { beob_anim(dt, false); if (Q.ohren && V.head) { V.head.rotation.x = .38; V.head.rotation.z = 0; } }
  if (Q.t >= Q.T) { V.g.visible = false; V.g.children[0].rotation.x = 0; S.sicht = null; if (Q.weg) beob_still(45); if (!Q.weg && !Q.still) beob_patter(V.g.position.x, V.g.position.z, 3, .8); } }
function beob_k2Tick(dt) { // die eine Fast-Sichtung: Durchgang nach Zimmer 7, Lüftungsklappe, 0,8 s, Lampe flackert, Gang leer, Gitter schwingt, drei nasse Abdrücke
  const S = beob_S, X = C2.x, Z = C2.z, V = S.V, K = S.k2; if (!V || !K) return;
  if (K.st === 'warten') { if (S.k2seen || !ch2.on || scripted || state.talking || !flashOn || ui.overlay) return; const P = player.pos;
    if (!(P.x > X + 30.3 && P.x < X + 32.6 && Math.abs(P.z - Z) < 1.6)) return; if (beob_facing(K.x, .6, K.z) < .88) return;
    S.k2seen = true; K.st = 'da'; K.t = 0; beob_show([K.x, 0, K.z]); V.tilt = .35; V.tiltT = 3; if (V.head) V.head.rotation.z = .35; if (typeof saveGame === 'function') saveGame(2); return; }
  if (K.st === 'da') { K.t += dt; beob_anim(dt, false); if (K.t >= .8) { state.flashFail = Math.max(state.flashFail, .16); K.st = 'flacker'; K.t = 0; } return; }
  if (K.st === 'flacker') { K.t += dt; if (K.t > .02 && V.g.visible) { V.g.visible = false; S.test.k2win.push(+(.8 + K.t).toFixed(3)); K.grill.w = 1; for (const q of K.prints) q.visible = true; } if (K.t > .2) { K.st = 'nach'; K.t = 0; } return; }
  if (K.st === 'nach') { K.t += dt; if (K.t > 10 && !K.kratz) { K.kratz = true; beob_scrapeAway(K.x, K.z); K.st = 'fertig'; } }
}
// ---------------------------------------------------------------- Spuren (Decals, Dossier 82 §4): Kratzer, nasse Abdrücke (trocknen in 40 s), ∴ im Beschlag, dreifingrige Abdrücke im Beschlag,
// drei Kiesel, gefaltetes Bonbonpapier, angelehnte Türen, verschobene Dinge, Schatten unter Türen
const BEOB_TEX = {};
function beob_texte() { const T = BEOB_TEX; if (T.done) return T; T.done = true;
  T.kratzer = tex(cnv(128, (x, w) => { x.clearRect(0, 0, w, w); for (let i = 0; i < 3; i++) { const x0 = 38 + i * 22 + rand(-3, 3); x.lineCap = 'round';
      for (const [col, lw] of [['rgba(30,22,16,.55)', 7], ['rgba(214,196,160,.95)', 3.2], ['rgba(250,240,215,.8)', 1.2]]) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.moveTo(x0, 20 + rand(0, 6)); x.bezierCurveTo(x0 + 4, 50, x0 + 7, 80, x0 + 11 + rand(-2, 2), 108 + rand(-6, 4)); x.stroke(); } } }), true);
  T.fuss = tex(cnv(128, (x, w) => { x.clearRect(0, 0, w, w); x.fillStyle = '#fff'; x.filter = 'blur(2px)'; x.beginPath(); x.ellipse(64, 84, 18, 26, 0, 0, 7); x.fill();
      for (const [a, L] of [[-.55, 30], [0, 36], [.55, 30]]) { const tx = 64 + Math.sin(a) * L * 1.2, ty = 60 - Math.cos(a) * L; x.beginPath(); x.ellipse(tx, ty, 7, 13, a, 0, 7); x.fill(); x.beginPath(); x.moveTo(64, 70); x.lineTo(tx, ty + 6); x.lineWidth = 9; x.strokeStyle = '#fff'; x.stroke(); } }), false);
  const beschlag = (hand) => cnv(256, (x, w) => { x.clearRect(0, 0, w, w); const g = x.createRadialGradient(w / 2, w / 2, 20, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(225,232,238,.55)'); g.addColorStop(.7, 'rgba(225,232,238,.35)'); g.addColorStop(1, 'rgba(225,232,238,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w);
    for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(240,245,250,${rand(.1, .35)})`; x.beginPath(); x.arc(rand(20, w - 20), rand(20, w - 20), rand(.6, 2), 0, 7); x.fill(); }
    x.globalCompositeOperation = 'destination-out'; x.fillStyle = 'rgba(0,0,0,.92)'; x.strokeStyle = 'rgba(0,0,0,.85)'; x.lineCap = 'round';
    const drip = (px, py, L) => { x.lineWidth = rand(2, 3.5); x.beginPath(); x.moveTo(px, py); x.lineTo(px + rand(-2, 2), py + L); x.stroke(); x.beginPath(); x.arc(px, py + L, 2.6, 0, 7); x.fill(); };
    if (hand) { for (const [hx, hy, a, s] of [[92, 96, -.25, 1], [166, 120, .2, .9], [120, 176, -.05, .8]]) { x.save(); x.translate(hx, hy); x.rotate(a); x.scale(s, s); x.beginPath(); x.ellipse(0, 10, 15, 17, 0, 0, 7); x.fill();
        for (const fa of [-.5, 0, .5]) { x.save(); x.rotate(fa); x.beginPath(); x.ellipse(0, -22, 5, 15, 0, 0, 7); x.fill(); x.restore(); } x.restore(); drip(hx + rand(-6, 6), hy + 26 * s, rand(25, 60)); } }
    else { for (const [px, py] of [[104, 100], [152, 100], [128, 142]]) { x.beginPath(); x.arc(px, py, 11, 0, 7); x.fill(); drip(px + rand(-2, 2), py + 9, rand(30, 70)); } } });
  T.beschlag = tex(beschlag(false), true); T.hand = tex(beschlag(true), true);
  T.bonbon = tex(cnv(64, (x, w) => { x.clearRect(0, 0, w, w); x.translate(32, 34); x.rotate(.3); x.fillStyle = '#e8efe6'; x.beginPath(); x.moveTo(-16, 10); x.lineTo(16, 10); x.lineTo(0, -16); x.closePath(); x.fill();
      x.fillStyle = '#3f8f64'; x.beginPath(); x.moveTo(-9, 6); x.lineTo(9, 6); x.lineTo(0, -8); x.closePath(); x.fill(); x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 1; for (let i = -12; i < 14; i += 5) { x.beginPath(); x.moveTo(i, 10); x.lineTo(i * .3, -10); x.stroke(); }
      x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(-12, 7, 24, 1.5); }), true);
  T.klappe = tex(cnv(128, (x, w) => { x.fillStyle = '#0a0a0b'; x.fillRect(0, 0, w, w); x.strokeStyle = '#5b5c58'; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, w - 10); x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 2; x.strokeRect(12, 12, w - 24, w - 24);
      x.fillStyle = 'rgba(90,70,50,.35)'; for (let i = 0; i < 40; i++) x.fillRect(rand(4, w - 8), rand(4, w - 8), rand(1, 4), rand(1, 4)); }), true);
  T.gitter = tex(cnv(128, (x, w) => { x.clearRect(0, 0, w, w); x.fillStyle = '#6e706b'; x.fillRect(0, 0, w, 8); x.fillRect(0, w - 8, w, 8); x.fillRect(0, 0, 8, w); x.fillRect(w - 8, 0, 8, w); for (let i = 16; i < w - 8; i += 12) { x.fillStyle = '#595b56'; x.fillRect(8, i, w - 16, 5); x.fillStyle = '#80827c'; x.fillRect(8, i, w - 16, 1.5); }
      x.fillStyle = 'rgba(120,80,40,.4)'; for (let i = 0; i < 30; i++) x.fillRect(rand(0, w), rand(0, w), rand(2, 6), rand(1, 3)); }), true);
  return T; }
function beob_decal(map, w, h, opt = {}) { const mat = new THREE.MeshStandardMaterial({ map: opt.alpha ? null : map, alphaMap: opt.alpha ? map : null, color: opt.color ?? 0xffffff, transparent: true, opacity: opt.op ?? 1, depthWrite: false,
    roughness: opt.rough ?? .9, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: opt.double ? THREE.DoubleSide : THREE.FrontSide });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.renderOrder = 2; m.receiveShadow = true; m.castShadow = false; m.visible = false; m.userData.noCol = true; scene.add(m); return m; }
// Wände: Normale als Winkel ry (0 → +z); Böden: rot.x = −π/2
function beob_spurNeu(art, o) { const T = beob_texte(), S = beob_S; let m;
  if (art === 'kratzer') { m = beob_decal(T.kratzer, o.w || .13, o.h || .16, { rough: .8 }); }
  else if (art === 'abdruck') { m = new THREE.Group(); m.visible = false; scene.add(m); const n = o.n || 7; const mat = new THREE.MeshStandardMaterial({ alphaMap: T.fuss, color: 0x0d0e10, transparent: true, opacity: .62, depthWrite: false, roughness: .08, metalness: .05, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const a = o.von, b = o.bis, dir = Math.atan2(b[0] - a[0], b[2] - a[2]); for (let i = 0; i < n; i++) { const u = i / Math.max(1, n - 1), x = a[0] + (b[0] - a[0]) * u + Math.cos(dir) * (i % 2 ? .07 : -.07), z = a[2] + (b[2] - a[2]) * u - Math.sin(dir) * (i % 2 ? .07 : -.07);
      const q = new THREE.Mesh(S.fussGeo || (S.fussGeo = new THREE.PlaneGeometry(.11, .13)), mat); q.rotation.set(-PI / 2, 0, dir + PI); q.position.set(x, (o.y ?? beob_gyAt(x, z)) + .012, z); q.renderOrder = 2; m.add(q); } m.userData.mat = mat; }
  else if (art === 'beschlag' || art === 'hand') { m = beob_decal(art === 'hand' ? T.hand : T.beschlag, o.w || .5, o.h || .5, { rough: .15, double: false }); if (o.spiegel) m.scale.x = -1; }
  else if (art === 'bonbon') { m = beob_decal(T.bonbon, .06, .06, { rough: .35 }); }
  else if (art === 'kiesel') { m = new THREE.Group(); m.visible = false; scene.add(m); if (S.kiesel) { [.055, .045, .034].reduce((y, s, i) => { const k = S.kiesel.clone(true); k.scale.multiplyScalar(s / S.kieselS); k.position.set(rand(-.006, .006), y + s * .45, rand(-.006, .006)); k.rotation.y = rand(0, 6); m.add(k); return y + s * .82; }, 0); } }
  if (!m) return null; const p = o.pos || [0, 0, 0]; if (art !== 'abdruck') { m.position.set(p[0], p[1], p[2]); if (o.boden || art === 'bonbon') m.rotation.set(-PI / 2, 0, o.ry || rand(0, 6)); else if (art !== 'kiesel') m.rotation.set(0, o.ry || 0, 0); }
  const sp = { art, m, k: o.k || null, sorte: o.sorte || (art === 'abdruck' ? 'frisch' : 'immer'), t: 0, an: false, fertig: false, seen: false, id: o.id || art + '_' + S.spuren.length, wenn: o.wenn || null, x: p[0], y: p[1], z: p[2], nie: !!o.nie };
  if (art === 'abdruck') { sp.x = (o.von[0] + o.bis[0]) / 2; sp.z = (o.von[2] + o.bis[2]) / 2; sp.y = o.von[1] ?? beob_gyAt(sp.x, sp.z); }
  if (art === 'bonbon' && !o.nie) { const hit = box(.35, .2, .35, p[0], p[1] + .08, p[2], hidden, { cast: false }); sp.hit = hit; hit.userData.beob = sp; }
  if (art === 'kiesel') { const hit = box(.3, .3, .3, p[0], p[1] + .1, p[2], hidden, { cast: false }); sp.hit = hit; }
  S.spuren.push(sp); return sp; }
function beob_gyAt(x, z) { try { const g = solidGround(x, 3, z); return g > -2 ? Math.max(0, g) : 0; } catch (e) { return 0; } }
function beob_spurAn(sp, an) { if (sp.an === an) return; sp.an = an; sp.m.visible = an; if (sp.hit) { if (an) { if (sp.art === 'bonbon') interact(sp.hit, 'Bonbonpapier', () => beob_bonbonPapier(sp)); else interact(sp.hit, 'Drei Kiesel', () => beob_kieselUm(sp)); } else uninteract(sp.hit); } }
function beob_bonbonPapier(sp) { beob_spurAn(sp, false); sp.fertig = true; Audio.paper(); subtitle('Gefaltet. Ordentlich. Wer faltet Bonbonpapier? Grundschullehrer. Und … das hier.', 4200); }
function beob_kieselUm(sp) { uninteract(sp.hit); sp.hit = null; const ks = sp.m.children; ks.forEach((k, i) => { k.position.set(rand(-.12, .12), .02, rand(-.12, .12)); k.rotation.z = rand(0, 3); }); Audio.play('stones1', { gain: .25, rate: 1.8, x: sp.x, y: sp.y, z: sp.z, ref: 2 }); }
// öffentliche Spur (Kapitel-APs): erscheint sofort (bzw. „frisch“ außerhalb des Blicks), gehört zum laufenden Kapitel
function beob_spur(art, o = {}) { const k = beob_ch(); const sp = beob_spurNeu(art, Object.assign({ k: [k] }, o)); if (!sp) return null; if (art !== 'abdruck' && sp.sorte !== 'frisch') beob_spurAn(sp, true); if (art === 'abdruck') { sp.sorte = 'jetzt'; beob_spurAn(sp, true); sp.t = 0; } return sp; }
function beob_spurTick(dt) { const S = beob_S, k = beob_ch(), P = player.pos;
  for (const sp of S.spuren) { if (sp.fertig) continue; const inK = !sp.k || sp.k.includes(k), ok = inK && (!sp.wenn || (() => { try { return sp.wenn(); } catch (e) { return false; } })());
    if (sp.sorte === 'immer') { if (sp.an !== ok) beob_spurAn(sp, ok); }
    else if (sp.sorte === 'frisch') { // „gerade eben“: legt sich, während Luke wegsieht, und trocknet in 40 s
      if (!sp.an && ok && !S.dyn.has(sp.id)) { const d = Math.hypot(P.x - sp.x, P.z - sp.z); if (d < 32 && d > 8 && beob_facing(sp.x, sp.y, sp.z) < .2) { S.dyn.add(sp.id); beob_spurAn(sp, true); sp.t = 0; } } }
    if (sp.an && (sp.sorte === 'frisch' || sp.sorte === 'jetzt') && sp.art === 'abdruck') { sp.t += dt; const op = Math.max(0, 1 - sp.t / 40); sp.m.userData.mat.opacity = .62 * op; if (op <= 0) { beob_spurAn(sp, false); sp.fertig = true; } }
    if (sp.an && !sp.seen) { const d = Math.hypot(P.x - sp.x, P.z - sp.z); if (d < 6 && beob_facing(sp.x, sp.y + .1, sp.z) > .9) { sp.seen = true; S.spurSeen++; if (S.spurSeen === 8 && typeof gedanke === 'function') gedanke('beob_hallo', 'Ja. Hallo. Ich weiß.', 900, 2); } } }
}
// Kapitel-Spuren (Hauptweg Kap. 1 laut Dossier 82 §5.1, soweit die Orte im Spiel stehen; Rest per beob_spur aus den Kapitel-Modulen)
function beob_spurenBau() { const S = beob_S;
  beob_spurNeu('kratzer', { pos: [-72.0, .78, 6.2], ry: PI / 2, w: .07, h: .15, k: [1, 2, 3, 4, 5, 6] });       // Pfosten des Ortsschilds
  beob_spurNeu('kratzer', { pos: [23.72, .43 + .72, -11.87], ry: 0, k: [1, 2, 3, 4, 5, 6] });                    // Türrahmen Nr. 7, Kinderhöhe
  beob_spurNeu('kratzer', { pos: [C2.x + 15.2, .7, C2.z - 1.83], ry: 0, k: [2] });                                 // Tunnel im Amt
  beob_spurNeu('abdruck', { id: 'k1_nr1', von: [-46.3, undefined, -8.9], bis: [-44.6, undefined, -2.6], n: 8, k: [1] }); // vor Nr. 1, enden mitten auf der Straße
  { let y = 1.2; try { const r = new THREE.Raycaster(new THREE.Vector3(28.4, 3, -6.9), new THREE.Vector3(0, -1, 0), 0, 4); const h = r.intersectObject(mailbox7.userData.group || mailbox7, true)[0]; if (h) y = h.point.y; } catch (e) {}
    beob_spurNeu('kiesel', { pos: [28.4, y, -6.9], k: [1] }); }                                                  // drei Kiesel auf dem Briefkasten von Nr. 7
  beob_spurNeu('kiesel', { pos: [-3.3, beob_gyAt(-3.3, 41.2), 41.2], k: [1] });                                  // Kirchberg
  beob_spurNeu('bonbon', { pos: [25.35, .436, -13.3], k: [1] });                                                    // Nr. 7, vor der Küchentür
  beob_spurNeu('bonbon', { pos: [108.4, beob_gyAt(108.4, 19.1) + .005, 19.1], k: [1, 3] });                       // Tankstelle
  // ∴ im Beschlag: Küchenfenster Nr. 7, sobald Luke aus dem Keller kommt
  const W = beob_fenster(29, -12, 4); if (W) beob_spurNeu('beschlag', { pos: W.p, ry: W.ry, w: .42, h: .42, k: [1], wenn: () => beob_S.wasBasement && !state.inBasement });
}
function beob_fenster(x, z, rMax) { if (typeof fassaden_S === 'undefined' || !fassaden_S.windows) return null; let best = null, bd = rMax;
  for (const W of fassaden_S.windows) { if (W.boarded || W.y > 3) continue; const c = W.g.localToWorld(new THREE.Vector3(W.x, W.y, W.z)), d = Math.hypot(c.x - x, c.z - z); if (d < bd) { bd = d; best = { W, c }; } }
  if (!best) return null; const W = best.W, n = new THREE.Vector3(Math.sin(W.ry), 0, Math.cos(W.ry)).transformDirection(W.g.matrixWorld); const ry = Math.atan2(n.x, n.z);
  return { p: [best.c.x + n.x * .03, best.c.y + .05, best.c.z + n.z * .03], ry, W }; }
// ---------------------------------------------------------------- Gänsehaut-Momente (Q-9), je mit Spannungs-Budget
const BEOB_GH_MAX = [0, 2, 1, 4, 3, 4, 3];
function beob_ghTick(dt) {
  const S = beob_S, G = S.gh, k = beob_ch(), mode = beob_mode(); G.t -= dt; beob_ghLook(dt); if (G.t > 0) return; G.t = rand(35, 70);
  if (mode === 'aus' || mode === 'decke' || beob_quiet() || beob_sperre() || beob_traurig()) return;
  if (S.c.gh >= (BEOB_GH_MAX[k] || 0)) return;
  if (typeof spannung_since === 'function' && spannung_since('peak') < 90) return;
  if (typeof spannung_can === 'function' && !spannung_can('beob_gh', 'minor')) return;
  const inRoom = typeof indoorRect === 'function' && !!indoorRect(), opts = [];
  if (inRoom) opts.push('verschoben'); opts.push('tuer'); if (!inRoom) opts.push('hand'); if (k >= 3) { opts.push('atemTuer'); opts.push('schatten'); }
  for (let tries = 0; tries < 3 && opts.length; tries++) { const i = Math.floor(Math.random() * opts.length), a = opts.splice(i, 1)[0];
    const ok = a === 'verschoben' ? beob_ghVerschieben(false) : a === 'tuer' ? beob_ghTuer() : a === 'hand' ? beob_ghHand() : a === 'atemTuer' ? beob_ghAtemTuer() : beob_ghSchatten();
    if (ok) { S.c.gh++; S.test.gh.push(a + '@' + Math.round(S.t)); if (typeof spannung_did === 'function') spannung_did('beob_gh', 'minor'); return; } }
}
// verschobene Dinge: nur was Luke eben noch angesehen hat, nur außerhalb des Blicks, ohne Ton (Lesepause: auch beim Lesen)
function beob_ghProps() { const G = beob_S.gh; if (G.props) return G.props; const L = [], v = new THREE.Vector3(), b = new THREE.Box3(), sz = new THREE.Vector3();
  if (typeof indoorRects === 'undefined') return G.props = L; const t0 = performance.now();
  for (const o of scene.children) { if (L.length > 900 || !(o.isMesh || (o.isGroup && o.children.length && o.children.length < 12)) || o.isInstancedMesh || o.isBatchedMesh || o.isSkinnedMesh || !o.visible) continue;
    if (o.userData.col || o.userData.noCol || interactables.includes(o) || o === beob_S.V?.g) continue; o.getWorldPosition(v); let r = null; for (const q of indoorRects) if (v.x > q.x0 && v.x < q.x1 && v.z > q.zb && v.z < q.zf) { r = q; break; } if (!r) continue;
    b.setFromObject(o); b.getSize(sz); const mx = Math.max(sz.x, sz.y, sz.z); if (!(mx > .1 && mx < .75)) continue; let lit = false; o.traverse(q => { if (q.isLight || interactables.includes(q)) lit = true; }); if (lit) continue;
    L.push({ o, x: v.x, y: v.y + sz.y / 2, z: v.z, r, seenT: -999, moved: false }); }
  G.propsMs = Math.round(performance.now() - t0); return G.props = L; }
function beob_ghLook(dt) { const S = beob_S, G = S.gh; G.look -= dt; if (G.look > 0 || !G.props) return; G.look = .5; const r = typeof indoorRect === 'function' ? indoorRect() : null; if (!r) return; const P = player.pos;
  for (const p of G.props) if (p.r === r && !p.moved && Math.hypot(p.x - P.x, p.z - P.z) < 6 && beob_facing(p.x, p.y, p.z) > .85) p.seenT = S.t; }
function beob_ghVerschieben(lesen) { const S = beob_S, r = typeof indoorRect === 'function' ? indoorRect() : null; if (!r) return false; beob_ghProps(); const P = player.pos;
  const c = S.gh.props.filter(p => p.r === r && !p.moved && S.t - p.seenT < 60 && S.t - p.seenT > 3 && (lesen || beob_facing(p.x, p.y, p.z) < .1) && Math.hypot(p.x - P.x, p.z - P.z) > 1.3 && Math.hypot(p.x - P.x, p.z - P.z) < 8);
  if (!c.length) return false; const p = c[Math.floor(Math.random() * c.length)]; p.moved = true; p.o.rotation.y += (Math.random() < .5 ? -1 : 1) * rand(.45, 1.1); p.o.position.x += rand(-.06, .06); p.o.position.z += rand(-.06, .06); p.o.updateMatrixWorld(true); return true; }
// angelehnte Tür (S-08): stand zu, steht jetzt einen Spalt auf – ohne Türgeräusch, nur außerhalb des Blicks
function beob_ghTuer() { const S = beob_S, P = player.pos; if (typeof doors === 'undefined') return false; const c = doors.filter(D => !D.open && Math.abs(D.cur) < .01 && !D.beobAjar && D !== (typeof fuseDoor !== 'undefined' ? fuseDoor : null));
  for (const D of c) { const x = D.pivot.position.x, z = D.pivot.position.z, d = Math.hypot(x - P.x, z - P.z); if (d < 4 || d > 16 || beob_facing(x, 1.2, z) > .2) continue;
    D.beobAjar = Math.sign(D.openAngle || 1) * rand(.14, .24); S.doorsAjar.push(D); return true; } return false; }
function beob_tuerTick() { const S = beob_S; for (let i = S.doorsAjar.length - 1; i >= 0; i--) { const D = S.doorsAjar[i]; if (D.open || Math.abs(D.cur) > .02) { D.beobAjar = 0; S.doorsAjar.splice(i, 1); continue; } D.pivot.rotation.y = D.cur + D.beobAjar; } }
// dreifingrige Kinderhand-Abdrücke im Beschlag eines Fensters: tauchen auf, während Luke wegsieht, trocknen in zwei Minuten
function beob_ghHand() { const S = beob_S, P = player.pos; if (typeof fassaden_S === 'undefined' || !fassaden_S.windows) return false; const H = S.hands.find(h => !h.an); if (!H) return false;
  const c = fassaden_S.windows.filter(W => !W.boarded && W.y < 2.6); for (let t = 0; t < 30 && c.length; t++) { const W = c[Math.floor(Math.random() * c.length)], q = W.g.localToWorld(beob_V.set(W.x, W.y, W.z)), d = Math.hypot(q.x - P.x, q.z - P.z);
    if (d < 5 || d > 15 || beob_facing(q.x, q.y, q.z) > .25) continue; const n = beob_V2.set(Math.sin(W.ry), 0, Math.cos(W.ry)).transformDirection(W.g.matrixWorld);
    H.m.position.set(q.x + n.x * .035, q.y - .12, q.z + n.z * .035); H.m.rotation.set(0, Math.atan2(n.x, n.z), 0); H.m.material.opacity = 1; H.m.visible = true; H.an = true; H.t = 0; return true; } return false; }
function beob_handTick(dt) { for (const H of beob_S.hands) if (H.an) { H.t += dt; if (H.t > 90) H.m.material.opacity = Math.max(0, 1 - (H.t - 90) / 40); if (H.t > 130) { H.an = false; H.m.visible = false; } } }
// Atem hinter einer geschlossenen Tür (zählt als Atmen: höchstens zweimal je Kapitel)
function beob_ghAtemTuer() { const S = beob_S, P = player.pos; if (S.c.atem >= 2 || typeof doors === 'undefined') return false;
  for (const D of doors) { if (D.open || Math.abs(D.cur) > .02) continue; const w = D.leaf.geometry.parameters.width || 1, cx = D.pivot.position.x + w / 2, z = D.pivot.position.z, d = Math.hypot(cx - P.x, z - P.z); if (d < 1 || d > 3.2) continue;
    const side = Math.sign(P.z - z) || 1; beob_atem(cx, z - side * .7, 1.0, 4); S.c.atem++; beob_setVp(cx, .43, z - side * .7); beob_evt('atem'); return true; } return false; }
// Schatten unter der Tür: Lichtspalt unten an einer geschlossenen Tür, zwei kleine Füße gehen durch und bleiben in der Mitte stehen
function beob_ghSchatten() { const S = beob_S, P = player.pos, Q = S.strip; if (!Q || Q.an || typeof doors === 'undefined') return false;
  for (const D of doors) { if (D.open || Math.abs(D.cur) > .02 || D.beobAjar) continue; const w = D.leaf.geometry.parameters.width || 1, cx = D.pivot.position.x + w / 2, z = D.pivot.position.z, d = Math.hypot(cx - P.x, z - P.z);
    if (d < 1.8 || d > 7 || beob_facing(cx, .5, z) < .8) continue; const side = Math.sign(P.z - z) || 1, y = D.leaf.position.y - 1.09;
    Q.m.position.set(cx, y + .014, z + side * .05); Q.m.rotation.set(0, side > 0 ? 0 : PI, 0); Q.m.scale.x = w - .08; Q.m.visible = true; Q.an = true; Q.t = 0; Q.D = D; return true; } return false; }
function beob_stripTick(dt) { const Q = beob_S.strip; if (!Q || !Q.an) return; Q.t += dt; const u = Q.m.material.uniforms, t = Q.t;
  u.uK.value = Math.min(1, t / .8) * (t > 7 ? Math.max(0, 1 - (t - 7) / 1.2) : 1); u.uF.value = t < 1.4 ? -.7 : t < 3 ? -.7 + (t - 1.4) / 1.6 * .7 : t < 5.4 ? 0 : (t - 5.4) * .6; u.uT.value = t;
  if (t > 3 && t < 3.1 && !Q.step) { Q.step = true; beob_patter(Q.m.position.x, Q.m.position.z - .6, 2, .35); } if (t > 8.2 || Q.D.open) { Q.an = false; Q.step = false; Q.m.visible = false; } }
function beob_stripBau() { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, .028), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uK: { value: 0 }, uF: { value: -.7 }, uT: { value: 0 } },
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'varying vec2 vU; uniform float uK, uF, uT; void main(){ float x = vU.x - .5; float lite = smoothstep(0., .25, vU.y) * (1. - smoothstep(.55, 1., vU.y)) * (.75 + .25 * sin(x * 40. + uT * .3));' +
      'float f1 = exp(-pow((x - uF - .06) / .045, 2.)), f2 = exp(-pow((x - uF + .06) / .045, 2.)); float a = lite * (1. - .92 * max(f1, f2)) * uK; gl_FragColor = vec4(vec3(1., .74, .45) * a * 1.4, 1.); }' }));
  m.visible = false; m.renderOrder = 3; m.userData.noCol = true; scene.add(m); beob_S.strip = { m, an: false, t: 0 }; }
// ---------------------------------------------------------------- Kapitel 1: Rückfall-Auslöser für die zwei Skript-Zettel (falls das Kapitel-Skript sie nicht selbst legt)
function beob_k1Tick() { const S = beob_S, P = player.pos; if (beob_ch() !== 1) return; if (state.inBasement) S.wasBasement = true;
  if (!S.given.has('b_k1_02') && (state.wrongCodes || 0) >= 3 && !ui.overlay && !state.talking) { if (beob_drop(beob_findDyn('b_k1_02'), { hinter: true })) { setTimeout(() => beob_patter(P.x - 2, P.z, 3, .8, .9), 500); } }
  if (!S.given.has('b_k1_01') && story.side.car && story.side.car.state === 'done' && !ui.overlay && !state.talking && typeof lenaCar !== 'undefined') {
    const c = lenaCar.position, d = Math.hypot(P.x - c.x, P.z - c.z); if (d > 4.5 && d < 14 && beob_facing(c.x, 1, c.z) < -.2) { // Papier unter dem Scheibenwischer, wie ein Strafzettel
      let pos = null; try { const r = new THREE.Raycaster(lenaCar.localToWorld(new THREE.Vector3(-.95, 2.4, 0)), new THREE.Vector3(0, -1, 0), 0, 3); const h = r.intersectObject(lenaCar, true).find(q => q.object.visible && q.object.material && !q.object.material.transparent); if (h) pos = [h.point.x, h.point.y - .01, h.point.z]; } catch (e) {}
      beob_drop(beob_findDyn('b_k1_01'), pos ? { pos } : { vor: true }); } } }
// ---------------------------------------------------------------- Aufbau
WORLD_MODS.push(['Der Beobachter', async () => {
  const S = beob_S; beob_texte();
  story.side.beobachter = story.side.beobachter || { title: 'Der Neunte', desc: '', state: 'hidden' }; beob_desc();
  // Eisen (02 D1): Laternenpfähle, Funkkasten, Eisenzäune/-gitter, Villentür, Ketten
  try { for (const L of (typeof lamps !== 'undefined' ? lamps : [])) { const p = L.g.position; S.eisen.push([p.x - .2, p.x + .2, p.z - .2, p.z + .2]); }
    if (typeof radioBox !== 'undefined') { const p = radioBox.position; S.eisen.push([p.x - .4, p.x + .4, p.z - .3, p.z + .3]); }
    const bb = new THREE.Box3(), re = /iron|eisen|gitter|kette|chain/i; scene.traverse(o => { if (!o.isMesh) return; const mt = o.material || {}, nm = (o.name || '') + ' ' + (mt.name || '') + ' ' + ((mt.map && mt.map.name) || '') + ' ' + ((o.parent && o.parent.name) || '');
      if (!re.test(nm)) return; bb.setFromObject(o); if (bb.isEmpty() || bb.max.x - bb.min.x > 60 || bb.max.z - bb.min.z > 60) return; S.eisen.push([bb.min.x, bb.max.x, bb.min.z, bb.max.z]); }); } catch (e) { console.warn('Beobachter: Eisen', e); }
  for (const o of BEOB_ORTE) { let x = o.x, z = o.z; for (let k = 0; k < 12 && (!beob_freeAt(x, z) || beob_eisen(x, z, .5)); k++) { const a = k * 2.1, r = .8 + k * .25; x = o.x + Math.cos(a) * r; z = o.z + Math.sin(a) * r; }
    const sg = solidGround(x, 1.5, z), y = sg > -1 ? Math.max(0, sg) : 0; const n = Object.assign({ x, y, z }, o, { x, z }); const N = beob_note(x, y, z, () => beob_readSpot(n)); n.m = N.m; n.hit = N.hit; n.m.visible = false; uninteract(n.hit); n.live = false; S.spots.push(n);
    if (typeof hintAdd === 'function') hintAdd({ id: 'beob_ort_' + o.id, x, y, z, kind: 'geheim', near: 20, open: () => n.live && !n.gone }); }
  try { const r = await MSL.gl.loadAsync('assets/boulder/model.gltf'); const b = new THREE.Box3().setFromObject(r.scene), s = b.getSize(new THREE.Vector3()); S.kiesel = r.scene; S.kieselS = Math.max(s.x, s.y, s.z) || 1;
    r.scene.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } }); } catch (e) { console.warn('Beobachter: Kiesel', e); }
  await beob_loadModel(); // vor dem Vorwärmen der Shader im Szenengraph (Basis übersetzt alle Programme beim Laden)
  beob_spurenBau(); beob_stripBau();
  for (let i = 0; i < 2; i++) { const m = beob_decal(BEOB_TEX.hand, .62, .5, { rough: .12 }); S.hands.push({ m, an: false, t: 0 }); }
  // Kapitel 2: offene Lüftungsklappe am Ende des Durchgangs (Gitter hängt an einer Schraube), drei nasse Abdrücke erscheinen erst mit der Sichtung
  { const X = C2.x, Z = C2.z, kx = X + 35.25, kz = Z + .7; const kl = beob_decal(BEOB_TEX.klappe, .42, .42, { rough: .7 }); kl.position.set(kx, C2.h - .012, kz); kl.rotation.set(PI / 2, 0, 0); kl.visible = true;
    const gp = new THREE.Group(); gp.position.set(kx - .21, C2.h - .02, kz - .2); scene.add(gp); const gr = new THREE.Mesh(new THREE.PlaneGeometry(.4, .4), new THREE.MeshStandardMaterial({ map: BEOB_TEX.gitter, color: 0x5a5b58, alphaTest: .4, side: THREE.DoubleSide, roughness: .7, metalness: .3 }));
    gr.position.set(.2, -.2, 0); gp.add(gr); gp.rotation.set(.25, 0, .5); gp.userData.noCol = true;
    const prints = [[kx - .9, kz - .25], [kx - .55, kz + .05], [kx - .18, kz + .02]].map(([x, z], i) => { const m = beob_decal(BEOB_TEX.fuss, .1, .12, { alpha: true, color: 0x0b0c0e, rough: .06, op: .7 }); m.position.set(x, .012, z); m.rotation.set(-PI / 2, 0, -PI / 2 + (i % 2 ? .15 : -.15)); return m; });
    S.k2 = { st: 'warten', t: 0, x: kx, z: kz, grill: { g: gp, w: 0, t: 0 }, prints }; }
  beob_ghProps(); beob_fotoHuelle();
  S.ready = true;
}]);
function beob_freeAt(x, z) { try { return !leben_inHouse(x, z, 1) && leben_free(x, z, .4, .5); } catch (e) { return true; } }
// Kapitel 5 (fotos.js-Regel): Polaroids zeigen ihn nie – außer dem einen Kreuzungsbild („Zuletzt neun“, Ziel mit Z.beob = true)
function beob_fotoHuelle() { if (typeof kamera_render === 'function' && !kamera_render.beob) { const o = kamera_render; kamera_render = function (stamp, Z) { const V = beob_S.V, was = V && V.g.visible;
    if (V && was && !(Z && Z.beob)) V.g.visible = false; try { return o.call(this, stamp, Z); } finally { if (V && was) V.g.visible = true; } }; kamera_render.beob = true; } }
WORLD_TICK.push((dt, t) => {
  const S = beob_S; if (!S.ready) return;
  if (!S.item) { S.item = true; ITEMS.murmel = { name: 'Milchweiße Murmel', desc: 'Lag beim letzten Zettel des Beobachters. Sie ist warm. Im Dunkeln leuchtet sie ganz schwach – wie ein Auge, das zurücksieht.' }; } // ITEMS entsteht erst nach den Modulen
  const k = beob_ch();
  if (k !== S.c.k) { S.c = beob_cNeu(k); S.stat.turns = 0; S.winNext = S.t + rand(240, 420); S.covers = null; if (S.peek) { beob_hide(); S.peek = null; } }
  // Orts-Zettel: Stadt ab Kapitel 3, Wald ab Kapitel 6, „wrack“ erst nach der Fraßstelle (PK-A A29) – auch rückwärts (Kapitelwahl, Laden)
  const town = k >= 3, wald = k >= 6, spuren = wald && typeof hungrige_S !== 'undefined' && hungrige_S.done.has('spuren');
  for (const n of S.spots) { if (n.gone) continue; const want = town && (!BEOB_WALD[n.id] || (wald && (n.id !== 'wrack' || spuren)));
    if (want !== n.live) { n.live = want; n.m.visible = want; if (want) { if (!interactables.includes(n.hit)) interactables.push(n.hit); } else uninteract(n.hit); } }
  for (const F of S.falling) { F.t += dt; const u = Math.min(1, F.t / F.T); F.m.position.set(F.x + Math.sin(F.t * 5 + F.s) * .09 * (1 - u), F.y0 + (F.y - F.y0) * (u * u * (3 - 2 * u)), F.z + Math.cos(F.t * 4 + F.s) * .07 * (1 - u));
    F.m.rotation.x = -PI / 2 + Math.sin(F.t * 7 + F.s) * .5 * (1 - u); F.m.rotation.y = Math.sin(F.t * 5.5) * .35 * (1 - u); if (u >= 1) { F.m.rotation.set(-PI / 2, 0, F.rz); F.done = true; } }
  if (S.falling.length && S.falling.every(F => F.done)) S.falling.length = 0;
  if (S.k2 && S.k2.grill.w > 0) { const G = S.k2.grill; G.t += dt; G.g.rotation.x = .25 + Math.sin(G.t * 5.2) * .45 * Math.exp(-G.t * .45); if (G.t > 9) G.w = 0; }
  beob_tuerTick(); beob_handTick(dt); beob_stripTick(dt); beob_spurTick(dt);
  if (S.sicht) { beob_sichtTick(dt); return; }
  const mode = beob_mode(); S.vpOk = mode !== 'aus';
  if (mode === 'aus') { if (S.V && S.V.g.visible) { beob_hide(); S.peek = null; } return; }
  S.t += dt; beob_k1Tick();
  if (k === 2 && S.k2 && S.k2.st !== 'fertig') beob_k2Tick(dt);
  if (k <= 1 && S.V && S.V.g.visible) { beob_hide(); S.peek = null; } // Kapitel 1: nie sichtbar
  // was Luke tut (für die Zettel und das Mutigerwerden)
  const st = S.stat, spd = Math.hypot(vel.x, vel.z); st.t += dt; let dy = player.yaw - st.lastYaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); st.acc = st.acc * Math.exp(-dt * 2) + dy; st.lastYaw = player.yaw; if (Math.abs(st.acc) > 2.4) { st.turns++; st.acc = 0; }
  if (spd < .2 && !ui.overlay) { st.still += dt; st.stillMax = Math.max(st.stillMax, st.still); } else if (spd >= .2) st.still = 0;
  if (flashOn !== st.fl) { if (!flashOn) { st.flashOff++; S.c.off++; } st.fl = flashOn; } const run = spd > 4.2; if (run && !st.run) st.runs++; st.run = run;
  if (typeof whiskey_S !== 'undefined' && whiskey_S.mood === 'still') S.wStill = (S.wStill || 0) + dt; else S.wStill = 0;
  if (k >= 6 && typeof tief_S !== 'undefined' && tief_S.inside) S.waldT = (S.waldT || 0) + dt;
  if (ch2.on && ch2.archiveSolved && !S.k2arch) S.k2arch = S.t;
  if (ui.overlay) S.noteOpenT += dt; else S.noteOpenT = 0;
  // Orts-Zettel: beim ersten Annähern ein Rascheln, als hätte er ihn gerade erst hingelegt
  const P = player.pos; for (const n of S.spots) if (n.live && !n.gone && !n.heard) { const d = Math.hypot(P.x - n.x, P.z - n.z); if (d < 13) { n.heard = true; beob_rustle(n.x + rand(-4, 4), n.z + rand(-4, 4), .8); beob_patter(n.x + 3, n.z + 3, 3); } }
  // Kapitel 2: im Sicherungsraum drei Klopfer in der Wand, sobald der Strom da ist (als hätte jemand applaudiert)
  if (k === 2 && ch2.power && !S.applaus && beob_in(C2.x + 29, C2.x + 37, C2.z - 2, C2.z + 9)) { S.applaus = true; setTimeout(() => { for (let i = 0; i < 3; i++) Audio.play('woodHit' + (i + 1), { gain: .14, rate: 1.5, x: C2.x + 36, y: 1.6, z: C2.z + 5, ref: 2, delay: .6 + i * .28 }); }, 1800); }
  if (S.peek) beob_peekTick(dt);
  // Höhepunkt der Regie: danach 2–3 min still, erstes Geräusch Papier
  if (typeof SP !== 'undefined' && SP.peak !== S.lastPeak) { if (S.lastPeak !== null && SP.peak > -900) { S.peakUntil = S.t + rand(120, 180); S.paperFirst = true; if (S.peek && S.V) { beob_hide(); S.peek = null; } } S.lastPeak = SP.peak; }
  // Stille-Fenster (A-29): zwei- bis dreimal je Kapitel 60–120 s ohne ihn (ab Kap. 3)
  if (mode === 'voll' && S.c.wins < S.c.winsMax && S.t > S.winNext && S.t > S.winUntil) { S.winUntil = S.t + rand(60, 120); S.c.wins++; S.winNext = S.winUntil + rand(300, 520); S.paperFirst = true; }
  const q = beob_quiet(), sp = mode !== 'klang' && beob_sperre();
  if (sp) { S.sperrT += dt; if (S.peek && S.V && S.V.g.visible && beob_facing(S.V.g.position.x, .6, S.V.g.position.z) < .5) { beob_hide(); S.peek = null; } }
  else if (S.sperrT > 0 && !q) { // Stille-Regel: nach mehr als 45 s Schweigen ist das erste Geräusch Papier; Kap. 3 lehrt es zweimal harmlos (B-K3-06)
    if (S.sperrT > BEOB.stille) { S.paperFirst = true; if (k === 3 && S.c.stilleLehr < 2) { S.c.stilleLehr++; if (S.c.stilleLehr === 1 && !S.given.has('b_k3_06')) setTimeout(() => { if (!beob_quiet()) beob_drop(beob_findDyn('b_k3_06')); }, 2500); } }
    S.sperrT = 0; }
  if (q || sp) { S.quietT += dt; return; }
  S.quietT += dt; beob_ghTick(dt);
  // Geräusche: Takt dynamisch 8–20 s (5.7), Kap. 1: 20–40 s; bei Stillstand fast doppelt so oft, im Dunkeln öfter und näher; Kap. 6 nach dem Höhepunkt alle 30 s
  const dark = !flashOn || FLASH.charge <= 0; let rate = st.still > 3 ? 1.8 : 1; if (dark && mode === 'voll') rate *= 1.5;
  S.sndT -= dt * rate;
  if (S.sndT < 0) { let g = mode === 'klang' ? BEOB.sndGapK1 : k === 4 && !beob_indoor() ? [10, 20] : BEOB.sndGap; if (k === 6 && typeof hungrige_S !== 'undefined' && hungrige_S.finale) g = [28, 32];
    const other = typeof spannung_since === 'function' && (spannung_since('minor') < 20 || spannung_since('major') < 20); // Budget beob: 20 – wenn gerade etwas anderes atmet, schweigt er
    S.sndT = rand(g[0], g[1]) * (beob_famN('rustle') + beob_famN('patter') + beob_famN('twig') > 12 ? 1.8 : 1);
    if (!other) beob_sound(); }
  // Zettel mit festem Anlass (Ort/Ereignis) sofort, die übrigen im Takt 150–260 s (Hilfe ausgenommen); nicht in Kap. 1 (dort nur per Skript)
  S.sofortT = (S.sofortT || 0) - dt; if (S.sofortT < 0 && state.zone !== 'canal') { S.sofortT = 1; const d = BEOB_DYN.find(d => d.sofort && !S.given.has(d.id) && k >= d.k && k <= (d.bis || d.k) && (() => { try { return d.when(); } catch (e) { return false; } })());
    if (d && (mode !== 'decke' || d.wo)) beob_drop(d); if (S.done && !S.given.has('final')) beob_drop(BEOB_FINAL_D, { hinter: true }); }
  S.noteT -= dt; if (S.noteT < 0 && state.zone !== 'canal') { const d = beob_nextNote(); S.noteT = d && (mode !== 'decke' || d.wo === 'gitter' || d.wo === 'vor' || d.id.startsWith('d_not')) && beob_drop(d, mode === 'decke' && !d.wo ? { gitter: true } : {}) ? rand(BEOB.gap[0], BEOB.gap[1]) : 20; if (d && d.stuck) S.noteT = Math.min(S.noteT, 60); }
  // kurz zu sehen (ab Kap. 3, draußen): am Rand hinter Deckung; mutiger bei Stillstand (> 20 s im Rücken, 6–8 m) und im Dunkeln
  if (mode === 'voll' && S.V && !S.peek && !beob_indoor()) {
    if (S.covers === null || S.coversKap !== k) beob_coversBau();
    if (st.still > 20 && S.t - (S.c.rueckenT ?? -999) > 180) { const sp2 = beob_peekSpot(-1, -.55, [6, 8]); if (sp2) { S.c.rueckenT = S.t; beob_peekStart(sp2, 'ruecken'); if (S.c.atem < 2) { beob_atem(sp2[0], sp2[2]); S.c.atem++; } } }
    S.peekT -= dt * (st.still > 3 ? 1.5 : 1);
    if (!S.peek && S.peekT < 0) { S.peekT = rand(BEOB.peekGap[0], BEOB.peekGap[1]) * (k === 4 ? 1.3 : 1); const far = dark ? [9, 15] : st.still > 3 ? [9, 15] : k === 4 ? [18, 30] : [14, 24];
      const first = k === 3 && !S.c.sight1 && Math.hypot(P.x - 4, P.z - 4) < 20 && ch3.cowSeen;
      const spx = first ? (beob_hinterDeckung(8, 7.6, .55, .55, .5, .92) || beob_peekSpot(.55, .9, [12, 20])) : beob_peekSpot(.62, .86, far); if (spx) { beob_peekStart(spx); if (k === 3) S.c.sight1 = true; } }
  }
  if (S.V && S.V.g.visible && S.peek) { const p = S.V.g.position, f = beob_facing(p.x, p.y + .5, p.z); if (f > .62) { S.test.vis += dt; S.test.maxVis = Math.max(S.test.maxVis, S.test.vis); } else S.test.vis = 0; } else S.test.vis = 0;
});
function beob_still(sek) { beob_S.stillUntil = Math.max(beob_S.stillUntil, beob_S.t + sek); }
function beobachter_falle(weg) { beob_S.falle = weg; const L = story.lore && story.lore.find(l => l.key === 'beob_b_k6_06'), r = BEOB_FALLE[weg]; // Rückseite nach der Falle (erst dann lesbar)
  if (L && r && !L.rueck) { L.rueck = true; L.html = L.html.replace(/<br><br><span style="letter-spacing/, '<br><br><small style="opacity:.75">(RÜCKSEITE)</small><br>' + r + '<br><br><span style="letter-spacing'); } }
window.__beob = { S: beob_S, drop: id => beobachter_zettel(id) || beob_drop(BEOB_DYN.find(d => d.id === id) || BEOB_NOT), zettel: beobachter_zettel,
  peek: () => { beob_coversBau(); const sp = beob_peekSpot(.62, .9); if (sp && beob_S.V) beob_peekStart(sp); return sp; }, sound: () => beob_sound(true), orte: BEOB_ORTE, sicht: beob_sichtung, pos: beob_pos, spur: beob_spur,
  gh: a => a === 'verschoben' ? beob_ghVerschieben(true) : a === 'tuer' ? beob_ghTuer() : a === 'hand' ? beob_ghHand() : a === 'atemTuer' ? beob_ghAtemTuer() : beob_ghSchatten(), mode: beob_mode }; // Testzugriff
