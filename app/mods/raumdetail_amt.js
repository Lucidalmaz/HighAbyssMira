// =====================================================================  RAUMDETAIL · Amt (Ebene −2): zweite Liste je Raum, siehe raumdetail.js
// Budget je Raum: ≤ 12 verschiedene Modelle (jedes = 1–2 Zeichenaufrufe, im Leistungs-Gate ≈ 5× gezählt), viele Instanzen derselben Modelle sind billig.

// ================= Amt · Kantine (Bundesstelle, März 2012): Mittagessen für ca. 30 Leute, Ausgabe am Tresen, Kaffeeecke, Tische in zwei Reihen
RD.bau.amt_kantine = async c => { const X = C2.x, Z = C2.z, r = c.r, S = rd_sammler(c);
  // Ausgabe-Tresen an der Nordwand (z0-Seite): Tabletts, Kasse – die Essensausgabe, an der alle vorbeigehen
  await c.b('tisch', X + 13.6, r.z0 + .5, { ry: 0, r: .1 });
  await c.stapel('gTeller', X + 12.9, r.z0 + .52, 5, { auf: true, stapel: true, r: .1, min: .6, max: 1.0 });
  await c.a('kasse', X + 14.35, r.z0 + .5, { r: .1, min: .6, max: 1.0, ry: PI + .1, stapel: true });
  // zweite Tischreihe (Süd): vier Plätze je Tisch, ein Stuhl umgekippt, Tabletts stehengeblieben
  await c.b('tisch', X + 10.5, Z + 6.8, { ry: .02, r: .25 }); await c.b('tisch', X + 14.5, Z + 6.9, { ry: -.03, r: .25 });
  for (const [dx, dz, ry] of [[-.6, -.8, 0], [.5, -.78, .1], [-.5, .78, PI], [.7, .8, PI - .12]]) await c.b('stuhl', X + 10.5 + dx, Z + 6.8 + dz, { ry, r: .15 });
  for (const [dx, dz, ry] of [[-.5, -.8, -.08], [.4, -.82, .05], [-.7, .8, PI + .1]]) await c.b('stuhl', X + 14.5 + dx, Z + 6.9 + dz, { ry, r: .15 });
  await c.b('stuhl', X + 16.2, Z + 6.4, { ry: 1.9, rz: PI / 2 - .1, r: .2 });
  await c.a('gTeller', X + 10.2, Z + 6.9, { r: .1, min: .6, max: .9, stapel: true }); await c.a('gTasse', X + 10.9, Z + 6.7, { r: .1, min: .6, max: .9, stapel: true });
  await c.a('gTeller', X + 14.2, Z + 6.8, { r: .1, min: .6, max: .9, stapel: true }); c.papierAuf('zeitung', .3, .4, X + 14.9, Z + 6.85, { min: .6, max: .9, rz: .5 });
  // Küchenzeile an der Westwand: Herd, darüber Hängeschrank
  await c.bw('herd', 'W', Z + 5.0, { r: .5, ry: PI / 2 }); await c.w('haengeschr', 'W', Z + 5.0, 1.75, { r: .4 });
  // Reinigungsecke (Ost, neben der Tür): Eimer, Besen, Mülltonne
  await c.b('holzeimer', r.x1 - .45, r.z0 + .55, { r: .3 }); await c.bw('besen', 'O', r.z0 + 1.5, { lehnen: .1, r: .4, ry: -PI / 2 }); await c.b('tonne', r.x1 - .45, Z + 7.2, { r: .3 });
  // Wand: Uhr über dem Tresen, Feuerlöscher an der Tür
  await c.w('uhr', 'S', X + 13.6, 2.0, { r: .3 }); await c.w('feuerlk', 'O', Z + 3.0, 1.2, { r: .3 });
  // Schmutz mit Ursache: Wasserfleck unter dem Tresen, Kaffeeflecken an den Tischen, Laufweg zur Tür
  c.fleck('grime', 1.6, .9, X + 13.6, .013, r.z0 + 1.0, 'floor', .3, 0x3a3228, .6); c.fleck('grime', 1.2, .8, X + 10.6, .013, Z + 6.6, 'floor', .7, 0x3a2e22, .5); c.fleck('grime', 1.0, .7, X + 14.6, .013, Z + 6.5, 'floor', .1, 0x3a2e22, .5);
  c.fleck('grime', 2.4, .8, X + 16.4, .013, Z + 4.3, 'floor', 1.57, 0x2a2622, .55);
  c.netz(r.x0 + .15, 2.35, r.z1 - .15, -PI / 4, .6); c.netz(r.x1 - .15, 2.4, r.z0 + .15, PI * .75, .5);
  S.fertig(); };

// ================= Amt · Tunnel / Wartebereich: wer hier wartet, hat eine Nummer – Begleitpersonen sitzen an der Nordwand
RD.bau.amt_tunnel = async c => { const X = C2.x, Z = C2.z, r = c.r, S = rd_sammler(c);
  await c.b('beistelltisch', X + 5.9, r.z1 - .4, { r: .2, ry: .2 });                                   // Beistelltisch zwischen den Stuhlreihen: Illustrierte, Aschenbecher
  await c.a('ascher', X + 5.9, r.z1 - .4, { r: .2, min: .4, max: .7, stapel: true }); c.papierAuf('zeitung2', .3, .4, X + 5.85, r.z1 - .42, { min: .4, max: .7, rz: .3 });
  await c.b('pflanze', X + 1.1, r.z1 - .45, { r: .3 });                                                // Zimmerpflanze am Eingang – vertrocknet seit 2012
  await c.bw('sackkarre', 'S', X + 9.3, { r: .4, ry: 0, lehnen: .12 });                                // Sackkarre, mit der die Aktenkisten zum Archiv gefahren wurden
  await c.b('tonne', X + 2.1, r.z0 + .4, { r: .3 }); await c.b('tonne', X + 16.6, r.z1 - .4, { r: .3 });
  await c.w('feuerlk', 'S', X + 8.2, 1.15, { r: .3 }); await c.w('kamera', 'S', X + 1.2, 2.05, { r: .3 }); await c.w('kamera', 'N', X + 16.9, 2.05, { r: .3 });  // Überwachung der Wartenden
  for (let i = 0; i < 3; i++) c.papier('akte', .21, .29, X + 12.7 + i * .35, .014 + i * .002, Z + .6 - i * .25, { rz: .6 + i * 1.3 }); // verlorene Formulare vor dem Automaten
  c.fleck('grime', 3.0, 1.0, X + 9, .013, Z, 'floor', 1.57, 0x2a2622, .5); c.fleck('grime', 1.2, .7, X + 15.4, .013, r.z0 + .7, 'floor', .2, 0x3a3228, .55);
  S.fertig(); };

// ================= Amt · Archiv: Aktenschränke in zwei Reihen, in der Mitte der Arbeitstisch – dazu, was beim Arbeiten anfällt
RD.bau.amt_archiv = async c => { const X = C2.x, Z = C2.z, r = c.r, S = rd_sammler(c);
  await c.stapel('karton', X + 28.8, r.z0 + .5, 3, { r: .5 }); await c.stapel('karton', X + 19.2, r.z1 - .5, 2, { r: .5, ry: .2 }); await c.b('karton', X + 20.1, r.z0 + .75, { r: .5, ry: -.2 });
  await c.b('rollwagen', X + 26.6, Z + 2.2, { r: .5, ry: .3 });                                        // Rollwagen für die Akten auf dem Weg zum Tisch
  await c.b('schreibtisch', X + 29.0, Z + 1.7, { r: .3, ry: -PI / 2 }); await c.b('esstuhl', X + 28.2, Z + 1.7, { r: .3, ry: PI / 2 });  // Schreibtisch der Archivarin
  await c.A('telefon', X + 29.0, Z + 1.9, { r: .25, min: .6, max: .9 }); await c.A('wecker', X + 29.0, Z + 1.4, { r: .25, min: .6, max: .9 });
  await c.b('tonne', X + 21.0, Z - 2.3, { r: .4 });
  await c.w('wanduhr', 'O', Z - 3.0, 2.0, { r: .5 }); await c.w('feuerlk', 'O', Z + 3.9, 1.2, { r: .4 }); await c.w('kamera', 'W', Z + 1.5, 2.1, { r: .3 });
  await c.stapel('ordner', X + 22.5, Z - 1.0, 4, { r: .4, cols: ['#8a8a78', '#5a6a5a', '#a89a7a', '#6a6a5a'] });
  for (let i = 0; i < 4; i++) c.papier('akte', .21, .29, X + 23.4 + i * .3, .014 + i * .002, Z - 1.4 + Math.sin(i * 2) * .4, { rz: i * 1.1 });
  c.fleck('grime', 6.0, 1.2, X + 24, .013, Z, 'floor', 0, 0x2a2622, .45); c.fleck('grime', 1.4, 1.0, X + 28.4, .013, Z + 1.7, 'floor', .4, 0x3a3228, .5);
  S.fertig(); };

// ================= Amt · Hängeregistratur: Schränke in zwei Reihen, ein Arbeitstisch mit Monitor
RD.bau.amt_registratur = async c => { const X = C2.x, Z = C2.z, r = c.r, S = rd_sammler(c);
  await c.stapel('karton', X + 17.2, r.z0 + .5, 3, { r: .4 }); await c.b('hocker', X + 13.7, Z - 5.3, { r: .4 }); await c.b('tonne', X + 7.0, Z - 4.5, { r: .5 });
  await c.b('rollwagen', X + 15.5, Z - 6.4, { r: .5, ry: -.6 }); await c.w('wanduhr', 'O', Z - 6.0, 2.0, { r: .4 });
  for (let i = 0; i < 3; i++) c.papier('akte', .21, .29, X + 10.3 + i * .35, .014 + i * .002, Z - 3.6 - i * .15, { rz: 2 + i });
  c.fleck('grime', 4.0, 1.0, X + 12, .013, Z - 5, 'floor', 0, 0x2a2622, .45);
  S.fertig(); };

// ================= Amt · Sicherungsraum: Schaltschrank, Wartungstisch, Notstrom – hier arbeitet der Haustechniker
RD.bau.amt_sicherung = async c => { const X = C2.x, Z = C2.z, r = c.r, S = rd_sammler(c);
  await c.b('generator', X + 35.2, Z + 6.9, { r: .3, ry: -PI / 2 + .2 });                              // Notstromaggregat in der Ecke
  await c.b('kanisterGruen', X + 34.7, Z + 7.3, { r: .3, ry: .8 }); await c.b('kanisterGruen', X + 35.3, Z + 7.5, { r: .3, ry: .1 });
  await c.b('werkzeugkiste', X + 31.5, Z + 5.2, { r: .5, ry: .3 });
  await c.A('multimeter', X + 30.6, Z + 3.3, { r: .3, min: .6, max: .9, ry: .4 });
  await c.w('verteiler', 'N', X + 31.4, 1.5, { r: .3 }); await c.w('wandlampe', 'N', X + 33.0, 2.1, { r: .3 }); await c.w('feuerlk', 'W', Z + 6.5, 1.2, { r: .3 }); await c.w('kamera', 'S', X + 34.8, 2.05, { r: .3 });
  c.kabel([[X + 35.2, .05, Z + 6.4], [X + 34.2, .015, Z + 6.0], [X + 33.4, .015, Z + 6.3], [X + 33.1, .4, Z + 7.75], [X + 33.1, 1.2, Z + 7.8]], .012);   // Verlängerungsleitung zum Schaltschrank
  c.fleck('grime', 1.2, 1.0, X + 35.0, .013, Z + 6.9, 'floor', .4, 0x1a1a14, .65);                    // Ölfleck unter dem Aggregat
  S.fertig(); };

// ================= Amt · Planungsraum: das Modell der Stadt, daneben der Plan, was in welcher Reihenfolge zu räumen war
RD.bau.amt_planung = async c => { const X = C2.x, Z = C2.z, r = c.r, S = rd_sammler(c);
  await c.b('stahlregal', r.x1 - .45, Z + 11.2, { r: .5, ry: -PI / 2 }); await c.b('tafel', X + 37.0, Z + 12.9, { r: .4, ry: .5 });
  await c.b('hocker', X + 33.0, Z + 12.4, { r: .5 }); await c.b('hocker', X + 35.4, Z + 9.6, { r: .5, ry: 1 }); await c.b('tonne', X + 30.6, Z + 13.4, { r: .3 });
  await c.b('schreibtisch', X + 31.0, Z + 11.2, { r: .3, ry: PI / 2 }); await c.A('wecker', X + 31.0, Z + 11.5, { r: .2, min: .6, max: .9 });
  await c.w('wanduhr', 'S', X + 37.0, 2.0, { r: .4 }); await c.w('feuerlk', 'W', Z + 9.0, 1.2, { r: .3 });
  c.fleck('grime', 3.0, 1.0, X + 34, .013, Z + 11, 'floor', 0, 0x2a2622, .45);
  S.fertig(); };

// ================= Amt · Zimmer 7: Hildes Büro – Teetasse, Familienfoto; Jacke am Haken, Stiefel an der Tür
RD.bau.zimmer7 = async c => { const X = C2.x, Z = C2.z, r = c.r, S = rd_sammler(c);
  await c.w('jacke', 'W', Z - 6.6, 1.5, { r: .3, col: 0x6a5a48 });
  await c.b('gummistiefel', X + 30.7, Z - 3.1, { r: .3, ry: .4 }); await c.b('pflanze', X + 35.3, Z - 7.3, { r: .3 });
  await c.A('stehrahmen1', X + 33.0, Z - 6.4, { r: .6, min: .6, max: .95, ry: .3 }); await c.A('wecker', X + 33.6, Z - 6.5, { r: .6, min: .6, max: .95 }); await c.A('teeset', X + 32.4, Z - 6.2, { r: .6, min: .6, max: .95 });
  await c.w('wanduhr', 'S', X + 33.0, 2.0, { r: .3 });
  S.fertig(); };

// ================= Amt · Prüfraum 3: Untersuchung – Rollstuhl, Schreibtisch mit Protokoll, Sanitätskasten
RD.bau.amt_pruef = async c => { const X = C2.x, Z = C2.z, r = c.r, S = rd_sammler(c);
  await c.b('rollstuhl', X + 38.0, Z - 3.4, { r: .6, ry: .6 }); await c.b('schreibtisch', X + 44.8, Z + 2.8, { r: .5, ry: -PI / 2 }); await c.b('esstuhl', X + 43.8, Z + 2.8, { r: .5, ry: PI / 2 });
  await c.A('multimeter', X + 44.8, Z + 3.5, { r: .4, min: .6, max: 1.0 }); await c.b('sanikasten', X + 37.2, Z + 4.4, { r: .5 }); await c.b('tonne', X + 45.0, Z - 4.4, { r: .5 });
  await c.w('feuerlk', 'W', Z + 3.5, 1.2, { r: .5 }); await c.w('kamera', 'S', X + 41.0, 2.1, { r: 1.5 }); await c.w('wanduhr', 'N', X + 41.0, 2.0, { r: 1.5 });
  S.fertig(); };

// ================= Amt · Langer Gang (59 m): Türen zu Nebenräumen; alle ~12 m Feuerlöscher, Kamera, Abfall, ein verlassener Rollwagen
RD.bau.amt_gang = async c => { const X = C2.x, Z = C2.z, S = rd_sammler(c);
  for (const [dx, i] of [[52, 0], [64, 1], [76, 2], [88, 3], [100, 4]]) { await c.w('feuerlk', i % 2 ? 'N' : 'S', X + dx, 1.2, { r: .8 }); await c.w('kamera', i % 2 ? 'S' : 'N', X + dx + 4, 2.15, { r: .8 }); }
  for (const [dx, nm] of [[57, 'tonne'], [70, 'karton'], [94, 'tonne']]) await c.b(nm, X + dx, Z + (dx % 2 ? 1.4 : -1.4), { r: .8, ry: dx * .7 });
  await c.b('rollwagen', X + 62, Z - 1.3, { r: .8, ry: .1 }); await c.b('sackkarre', X + 91, Z + 1.4, { r: .8 });
  for (const dx of [50, 68, 86]) c.fleck('grime', 2.6, 1.0, X + dx, .013, Z, 'floor', 0, 0x2a2622, .5);
  S.fertig(); };

// ================= Amt · Vorraum (vor dem Messraum): Aktenschränke, Tisch mit Bildschirm – hier wartet, wer zur Messung gerufen wird
RD.bau.amt_vorraum = async c => { const X = C2.x, Z = C2.z, r = c.r, S = rd_sammler(c);
  await c.stapel('karton', r.x1 - .5, r.z0 + .5, 3, { r: .5 }); await c.b('tonne', r.x1 - .45, Z - .7, { r: .4 }); await c.b('hocker', X + 107.4, Z - 5.2, { r: .5 });
  await c.w('feuerlk', 'W', Z + 1.6, 1.2, { r: .4 }); await c.w('kamera', 'O', Z - 2.0, 2.15, { r: .5 }); await c.b('rollwagen', X + 108.9, Z + 1.6, { r: .6, ry: 1.2 });
  for (let i = 0; i < 3; i++) c.papier('akte', .21, .29, X + 108.2 + i * .3, .014 + i * .002, Z + 3.4 - i * .2, { rz: .8 + i });
  c.fleck('grime', 2.0, 1.2, X + 108, .013, Z, 'floor', 0, 0x2a2622, .5);
  S.fertig(); };

// ================= Amt · Messraum: Stuhl 8, der Tank, Messtechnik – dazu Schaltkästen, Kabel zum Tank, Arbeitstisch
RD.bau.amt_messraum = async c => { const X = C2.x, Z = C2.z, r = c.r, S = rd_sammler(c);
  await c.w('stromkasten', 'W', Z - 4.5, 1.5, { r: .8 }); await c.w('stromkasten', 'O', Z - 5.5, 1.5, { r: .8 });
  await c.b('schreibtisch', r.x0 + .5, Z - 2.2, { r: .6, ry: PI / 2 }); await c.A('messgeraet', r.x0 + .5, Z - 2.2, { r: .5, min: .6, max: 1.0 });
  await c.b('esstuhl', r.x0 + 1.4, Z - 2.2, { r: .5, ry: PI / 2 + .3 }); await c.b('rollwagen', r.x0 + .7, Z + 2.8, { r: .6, ry: PI / 2 }); await c.b('werkzeugkiste', r.x1 - .6, Z + 3.0, { r: .6, ry: .4 });
  await c.w('kamera', 'S', X + 114.0, 2.15, { r: 1.5 }); await c.w('feuerlk', 'W', Z + 2.0, 1.2, { r: .5 });
  c.kabel([[r.x0 + .4, .03, Z - 1.0], [X + 113, .015, Z - .5], [X + 115, .015, Z + .6], [X + 116.5, .015, Z + 2.5], [X + 117.4, .02, Z + 4.2]], .014);   // Messleitungen zum Tank
  c.fleck('grime', 3.0, 1.6, X + 115, .013, Z, 'floor', .3, 0x1a1a14, .5);
  S.fertig(); };
