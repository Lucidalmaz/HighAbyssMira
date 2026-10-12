// =====================================================================  RAUMDETAIL · Villa, Keller, Kapelle, Hütten: zweite Liste je Raum, siehe raumdetail.js
// Teppich: flache Platte aus einem Stoff-Scan (kein Canvas), 8 mm über dem Boden
function rd_teppich(c, S, x, z, w, d, y0, key = 'dirty_carpet', tint = 0xc08070, rot = 0) { S.add(rd_mat('rdt_' + key, { nrm: .8, po: true, tint }), rd_plane(w, d, x, y0 + .008, z, 1.2, rot)); }

// ================= Villa · Arbeitszimmer des Dr. Seiler: Schreibtisch, Lampe, Regale mit Akten – der Gründer des Amts hat hier bis 2019 gearbeitet
RD.bau.v_az = async c => { const r = c.r, S = rd_sammler(c);
  rd_haus(c, 0, [{ x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 }], [], { fy: .012, tint: 0x3a3028 });
  rd_teppich(c, S, -917.0, 899.8, 3.6, 2.6, 0, 'dirty_carpet', 0xb06a60);
  await c.b('sessel', -914.2, 902.9, { r: .5, ry: PI * .8 }); await c.b('rundtisch', -915.0, 902.0, { r: .5 });
  await c.A('oellampe', -915.0, 902.0, { r: .15, min: .5, max: 1.0 });
  await c.b('standuhr', -920.4, 896.7, { r: .5, ry: PI / 2 }); await c.b('koffer', -919.6, 903.4, { r: .6, ry: .5 }); await c.b('tonne', -919.8, 897.3, { r: .4 });
  await c.w('zierrahmen', 'N', -917.5, 2.0, { r: .8 });
  S.fertig(); };

// ================= Villa · Anrichte: Zwischenraum zum Speisezimmer – Geschirrschrank, Servierwagen, Stühle
RD.bau.v_an = async c => { const r = c.r, S = rd_sammler(c);
  rd_haus(c, 0, [{ x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 }], [], { fy: .012, tint: 0x3a3028 });
  rd_teppich(c, S, -888, 900, 2.6, 3.4, 0, 'dirty_carpet', 0x6a8a6a);
  await c.b('rollwagen', -886.6, 898.0, { r: .5, ry: .3 }); await c.b('esstuhl', -889.5, 901.5, { r: .5, ry: 2.4 }); await c.b('kommode', -885.7, 901.5, { r: .5, ry: -PI / 2 });
  await c.A('vase1', -885.7, 901.5, { r: .5, min: .6, max: 1.4 });
  S.fertig(); };

// ================= Villa · Obergeschoss: langer Gang mit Karteikästen – dazu Läufer, Standuhr, Kommode, Bilder
RD.bau.v_og = async c => { const r = c.r, S = rd_sammler(c);
  rd_haus(c, 0, [{ x0: r.x0, x1: -892.1, z0: r.z0, z1: r.z1 }, { x0: -891.9, x1: r.x1, z0: r.z0, z1: r.z1 }], [], { fy: .012, tint: 0x3a3028 });
  rd_teppich(c, S, -900, 929.5, 12, 1.1, 0, 'dirty_carpet', 0xa05a50);
  await c.b('standuhr', -907.2, 927.2, { r: .6, ry: PI }); await c.b('koffer', -905.0, 927.4, { r: .6, ry: .3 }); await c.b('pflanze', -894.0, 927.4, { r: .5 });
  await c.b('kommode', -889.0, 928.0, { r: .8, ry: PI }); await c.w('zierrahmen', 'S', -903.0, 1.8, { r: 1.5 });
  S.fertig(); };

// ================= Villa · Keller: Kisten, Karton, Werkzeug, Ofen – hier wurde 2012 die Kühlung eingerichtet
RD.bau.v_kr = async c => { const r = c.r, S = rd_sammler(c);
  await c.b('kiste', -906.8, 867.2, { r: .6 }); await c.b('karton', -903.0, 866.8, { r: .6 }); await c.b('werkzeugkiste', -897.0, 871.2, { r: .6, ry: .2 });
  await c.b('holzeimer', -893.0, 866.9, { r: .5 }); await c.b('kanisterGruen', -890.0, 871.0, { r: .6 }); await c.b('ofen', -895.0, 870.9, { r: .6 });
  c.fleck('grime', 2.6, 1.6, -900, .013, 869, 'floor', .4, 0x1a1a14, .6);
  S.fertig(); };

// ================= Villa · Nr. 9 (Kap. 4): Vegas' Beobachtungsraum – Funkgeräte, Ordner, Alufolie
RD.bau.v_nr9 = async c => { const r = c.r, S = rd_sammler(c);
  rd_haus(c, 0, [{ x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 }], [], { fy: .012, tint: 0xb8b0a0 });
  await c.b('schreibtisch', -980.0, 899.3, { r: .8 }); await c.b('esstuhl', -980.0, 898.3, { r: .5, ry: PI });
  await c.A('multimeter', -980.2, 899.3, { r: .5, min: .6, max: 1.0 }); await c.A('kofferradio', -979.2, 899.4, { r: .5, min: .6, max: 1.0 });
  await c.b('metallregal', -976.0, 898.0, { r: .8, ry: -PI / 2 }); await c.b('karton', -984.2, 896.8, { r: .6 }); await c.b('kanisterGruen', -984.2, 900.2, { r: .6 });
  S.fertig(); };

// ================= Nr. 3 · Vegas' Stube: Sofa, Alufolie, Kabelsalat – dazu Tisch, Radio, Karton
RD.bau.nr3 = async c => { const r = c.r, S = rd_sammler(c);
  rd_haus(c, 0, [{ x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 }], [], { fy: .012, tint: 0xb8b0a0 });
  await c.b('rundtisch', -981.3, 857.3, { r: .6 }); await c.A('kofferradio', -981.3, 857.3, { r: .3, min: .5, max: 1.0 });
  await c.b('karton', -984.2, 859.6, { r: .6 }); await c.b('korb', -983.6, 856.0, { r: .5 }); await c.b('pflanze', -977.6, 855.7, { r: .4 });
  S.fertig(); };

// ================= Keller Nr. 7: das Ritual; davor war es ein Heizkeller – Kisten, Werkzeug, Gasflasche
RD.bau.keller7 = async c => { const S = rd_sammler(c);
  await c.b('kiste', 297.2, 303.4, { r: .6, ry: .3 }); await c.b('karton', 297.0, 297.3, { r: .6, ry: .2 }); await c.b('holzeimer', 302.5, 303.5, { r: .5 }); await c.b('werkzeugkiste', 296.0, 300.5, { r: .6, ry: PI / 2 });
  S.fertig(); };

// ================= Kapelle St. Martin (innen): Bänke, Altar; dazu Läufer im Mittelgang, Sakristeischrank, Seitenkommode mit Vase und Leuchter, Gesangbuchregal, Hocker
RD.bau.kapelle = async c => { const r = c.r, S = rd_sammler(c), cx = (r.x0 + r.x1) / 2;
  rd_teppich(c, S, cx, (r.z0 + r.z1) / 2 + .6, 1.3, 9.6, 0, 'dirty_carpet', 0xb06860);                              // Läufer im Mittelgang (Kirchenrot, abgetreten)
  await c.bw('mschrank', 'W', r.z0 + 1.4, { r: .5, ry: PI / 2 });                                                  // Sakristeischrank links vom Altar
  await c.b('kommode', cx + 1.8, r.z0 + .55, { r: .4 });                                                           // Seitenkommode rechts vom Altar
  await c.A('vase2', cx + 1.8, r.z0 + .55, { r: .3, min: .5, max: 1.5 }); await c.A('leuchter', cx + 2.1, r.z0 + .55, { r: .3, min: .5, max: 1.5 });
  await c.bw('wregal', 'W', r.z1 - 1.0, { r: .5, ry: PI / 2 });                                                    // Gesangbuchregal an der Türwand
  await c.b('holzhocker', cx - 2.2, r.z0 + 1.0, { r: .5, ry: .4 }); await c.b('holzhocker', cx - 1.7, r.z0 + 1.4, { r: .5, ry: -.8 });
  await c.b('pflanze', r.x1 - .6, r.z0 + 1.0, { r: .5 }); await c.b('korb', r.x1 - .6, r.z1 - 1.2, { r: .4 });
  for (let i = 0; i < 7; i++) for (const sx of [-1, 1]) { if ((i * 3 + (sx > 0 ? 1 : 0)) % 4 === 0) continue; await c.A('buchL', cx + sx * 1.7 + sx * ((i * 7) % 5) * .05, r.z0 + 2.2 + i * 1.38 + ((i * 3) % 4) * .03, { r: .12, min: .3, max: .7, ry: i * 1.3 + sx }); } // Gesangbücher auf den Bänken, nicht auf jeder
  await c.b('tafel', r.x0 + 1.1, r.z0 + 3.4, { r: .4, ry: PI / 2 + .3 });                                          // Liednummern-Tafel neben der ersten Bank
  for (const dz of [2.2, 5.6, 9.0]) { const z = r.z0 + dz; await c.fix('kaefiglampe', cx, c.y0 + 4.5, z, { ry: dz }); c.kabel([[cx, c.y0 + 6.0, z], [cx + .01, c.y0 + 5.2, z], [cx, c.y0 + 4.82, z]], .006); } // Pendelleuchten über dem Mittelgang, stromlos
  S.fertig(); };

// ================= Günthers Schuppen: Werkbank, Regal, Reifen; dazu Kisten, Werkzeug, Öllampe
RD.bau.schuppen = async c => { const S = rd_sammler(c);
  await c.b('kiste', -1481.9, 1439.0, { r: .5 }); await c.b('werkzeugkiste', -1478.2, 1439.0, { r: .5 }); await c.b('altreifen', -1481.8, 1441.2, { r: .5 }); await c.A('oellampe', -1478.8, 1438.6, { r: .5, min: .6, max: 1.2 });
  S.fertig(); };

// ================= Nr. 9 Posten (Messstelle Kirchberg): Schreibtisch, Funk – dazu Pult, Hocker, Wecker, Tonne
RD.bau.posten = async c => { const S = rd_sammler(c);
  await c.b('schulpult', -1520.8, 1400.8, { r: .5, ry: PI / 2 }); await c.b('holzhocker', -1519.8, 1399.0, { r: .5 }); await c.A('wecker', -1520.3, 1398.9, { r: 1.0, min: .6, max: 1.1 }); await c.b('tonne', -1518.5, 1401.2, { r: .4 });
  S.fertig(); };

// ================= Tankstelle · Kiosk: Tresen, Regale, Ware – dazu Kasse, Kühlschrank, Getränkekisten, Wischeimer, Uhr (Nachtschalter, Okt. 2009)
RD.bau.kiosk = async c => { const r = c.r, S = rd_sammler(c);
  await c.b('kuehl', 116.6, 25.7, { r: .4, ry: PI });                                                       // Kühlschrank für Getränke
  await c.b('plastikkiste', 115.2, 29.9, { r: .4, ry: .2 }); await c.b('plastikkiste', 114.6, 29.6, { r: .3, ry: -.3 });     // Getränkekisten, leer
  await c.b('holzeimer', 107.0, 25.9, { r: .4 }); await c.b('warnschild', 111.2, 26.8, { r: .5, ry: .3 });   // Wischeimer und Schild – frisch gewischt am 31.10.
  await c.w('wanduhr', 'N', 113.0, 2.4, { r: .5 }); await c.w('feuerlk', 'N', 111.2, 1.3, { r: .6 }); await c.w('kamera', 'N', 117.0, 2.8, { r: .5 });
  c.fleck('grime', 2.4, 1.2, 111, .035, 26.8, 'floor', .1, 0x2a2622, .5);                                   // Laufweg hinter dem Tresen
  S.fertig(); };

// ================= Zayns Hütte: Bretterhütte, Blechdach – ein Kind schläft hier manchmal; Decke, Kerzenstümpfe, Konserven, Kleidung
RD.bau.huette = async c => { const r = c.r, S = rd_sammler(c);
  rd_teppich(c, S, 58.7, 150.0, 1.5, 1.1, 0, 'dirty_carpet', 0x8a8a7a, .3);                               // Schlafdecke auf dem Boden
  await c.b('kissen', 59.2, 150.2, { r: .2, ry: .5 }); await c.b('kiste', 57.0, 150.6, { r: .3, ry: .2 });  // Kissen, Kiste als Nachttisch
  await c.A('laterne', 57.0, 150.6, { r: .15, min: .3, max: .9 });                                           // Laterne ohne Licht auf der Kiste
  await c.b('dosen', 57.3, 148.2, { r: .3 }); await c.b('konserven', 57.9, 148.3, { r: .3, ry: .8 });        // leere Konserven
  await c.b('gummistiefel', 59.1, 148.4, { r: .3, ry: .7 }); await c.b('holzeimer', 56.9, 149.4, { r: .3 }); await c.b('thermos3', 58.2, 148.3, { r: .3 });
  c.kabel([[56.4, 1.9, 148.1], [57.4, 1.75, 148.2], [58.4, 1.8, 148.15], [59.5, 1.9, 148.1]], .005);        // Wäscheleine an der Südwand
  S.fertig(); };

// ================= Weiß · Räume 1–3: Nimmerheim ist das Haus, wie es in der Erinnerung steht – ausgewaschen. Die zusätzlichen Dinge bekommen dasselbe Weiß (whiteMat, ohne Textur)
RD.bau.weiss1 = async c => { const r = c.r, S = rd_sammler(c);
  await c.b('wholzhocker', r.x0 + .6, r.z1 - .5, { r: .3, ry: .4 }); await c.b('wgummistiefel', r.x0 + 1.3, r.z1 - .55, { r: .3, ry: .8 });   // Garderobe: jemand ist gerade gegangen
  await c.b('wkorb', r.x1 - .7, r.z0 + .6, { r: .3, ry: .3 });
  S.fertig(); };
RD.bau.weiss2 = async c => { const r = c.r, S = rd_sammler(c), cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
  await c.b('wrundtisch', cx + 2.6, cz - 1.8, { r: .4 }); await c.A('wteekanne', cx + 2.6, cz - 1.8, { r: .2, min: .5, max: 1.0 });                  // Küchentisch mit Teekanne
  await c.b('wkorb', r.x0 + 1.6, r.z0 + 1.0, { r: .4 }); await c.b('wpflanze', r.x1 - .8, r.z1 - .8, { r: .4 });                                    // Spielkorb, Pflanze
  S.fertig(); };
RD.bau.weiss3 = async c => { const r = c.r, S = rd_sammler(c);
  await c.b('wleuchter', r.x1 - .8, r.z0 + .9, { r: .3 }); await c.b('wvase', r.x0 + .9, r.z0 + .9, { r: .3 }); await c.b('wkorb', r.x0 + .9, r.z1 - 1.0, { r: .4 });
  S.fertig(); };

// ================= Villa · Halle (Kap. 4): Treppenhaus der Villa Seiler – Läufer, Bilder, Standuhr, Sessel mit Beistelltisch; Seilers Haus, seit 2019 leer
RD.bau.v_halle = async c => { const r = c.r, S = rd_sammler(c), cx = (r.x0 + r.x1) / 2;
  rd_teppich(c, S, cx, r.z0 + 3.4, 2.0, 5.6, 0, 'dirty_carpet', 0xa05a50);                                    // Läufer von der Haustür zur Treppe
  await c.b('standuhr', r.x1 - .6, r.z0 + 1.2, { r: .6, ry: -PI / 2 }); await c.b('sessel', r.x0 + 1.2, r.z0 + 3.2, { r: .8, ry: PI * .35 });
  await c.b('beistelltisch', r.x0 + .9, r.z0 + 4.4, { r: .6 }); await c.A('vase1', r.x0 + .9, r.z0 + 4.4, { r: .3, min: .4, max: .9 });
  await c.b('pflanze', r.x1 - .8, r.z1 - 3.0, { r: .6 }); await c.b('koffer', r.x0 + 1.0, r.z1 - 1.2, { r: .6, ry: .5 });
  await c.w('zierrahmen', 'W', cx + .5, 2.5, { r: 1.5 }); await c.w('bild2', 'O', cx - 2.0, 2.4, { r: 1.5 }); await c.w('bild1', 'O', cx + 1.5, 2.4, { r: 1.5 });
  await c.w('spiegel', 'W', cx - 3.0, 1.8, { r: 1.5 });
  c.fleck('grime', 3.0, 2.0, cx, .013, r.z0 + 1.0, 'floor', .2, 0x1a1a14, .5);                                  // Regen- und Schmutzspuren an der Tür
  S.fertig(); };
