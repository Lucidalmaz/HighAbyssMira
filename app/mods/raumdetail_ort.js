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

// ================= Kapelle St. Martin (innen): Bänke, Altar; dazu Vasen am Altar, Pflanze, Bilder
RD.bau.kapelle = async c => { const S = rd_sammler(c);
  await c.b('vaseA', -1480.8, 1395.2, { r: .6 }); await c.b('leuchter', -1479.4, 1397.0, { r: .5 }); await c.b('pflanze', -1477.2, 1405.6, { r: .5 }); await c.b('holzhocker', -1482.8, 1403.6, { r: .5 });
  await c.w('zierrahmen', 'O', 1400.0, 1.9, { r: 1.5 });
  S.fertig(); };

// ================= Günthers Schuppen: Werkbank, Regal, Reifen; dazu Kisten, Werkzeug, Öllampe
RD.bau.schuppen = async c => { const S = rd_sammler(c);
  await c.b('kiste', -1481.9, 1439.0, { r: .5 }); await c.b('werkzeugkiste', -1478.2, 1439.0, { r: .5 }); await c.b('altreifen', -1481.8, 1441.2, { r: .5 }); await c.A('oellampe', -1478.8, 1438.6, { r: .5, min: .6, max: 1.2 });
  S.fertig(); };

// ================= Nr. 9 Posten (Messstelle Kirchberg): Schreibtisch, Funk – dazu Pult, Hocker, Wecker, Tonne
RD.bau.posten = async c => { const S = rd_sammler(c);
  await c.b('schulpult', -1520.8, 1400.8, { r: .5, ry: PI / 2 }); await c.b('holzhocker', -1519.8, 1399.0, { r: .5 }); await c.A('wecker', -1520.3, 1398.9, { r: 1.0, min: .6, max: 1.1 }); await c.b('tonne', -1518.5, 1401.2, { r: .4 });
  S.fertig(); };
