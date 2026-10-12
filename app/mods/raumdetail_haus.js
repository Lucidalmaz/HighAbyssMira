// =====================================================================  RAUMDETAIL · Häuser (Nr. 1, 4, 7, Gisela, Pfarrhaus …): zweite Liste je Raum, siehe raumdetail.js
// Boden und Leisten sind zusammengefasste Geometrie (1–4 Zeichenaufrufe je Raum), dazu höchstens ~10 verschiedene Modelle.

// ================= Nr. 7 · Hilde Wendts Haus: vier Räume (Wohnzimmer SW, Küche SO, Schlafzimmer NW, Hauswirtschaft NO); Böden und Leisten, damit es nach Wohnung aussieht
RD.bau.nr7 = async c => { const Y = c.y0, S = rd_sammler(c);
  rd_haus(c, Y, [
    { x0: 20.3, x1: 25.9, z0: -16.9, z1: -12.3, boden: 'wood_floor_worn', tile: 1.5 },        // Wohnzimmer: Dielen
    { x0: 26.1, x1: 31.7, z0: -16.9, z1: -12.3, boden: 'old_linoleum_flooring_01', tile: 1.3, tint: 0xb8b0a0 }, // Küche: Linoleum
    { x0: 20.3, x1: 25.9, z0: -21.7, z1: -17.1, boden: 'wood_floor_worn', tile: 1.5 },          // Schlafzimmer: dieselben Dielen (ein Zeichenaufruf)
    { x0: 26.1, x1: 31.7, z0: -21.7, z1: -17.1 }],                                               // Hauswirtschaft: Beton bleibt
    [{ ax: 'x', at: -17.0, pos: 23.0, w: 1.0 }, { ax: 'x', at: -17.0, pos: 29.5, w: 1.0 }, { ax: 'z', at: 26.0, pos: -14.0, w: 1.1 }]);
  await c.A('stehrahmen2', 20.5, -15.8, { r: .3, min: Y + .8, max: Y + 1.3, ry: .5 });                         // Familienfoto auf der Anrichte
  await c.b('korb', 25.3, -16.4, { r: .4, ry: .4 }); await c.b('pflanze', 25.35, -12.7, { r: .3 });             // Wäschekorb, Pflanze am Fenster
  await c.A('kessel', 30.8, -12.6, { r: .3, min: Y + .7, max: Y + 1.2 });                                      // Küche: Wasserkessel (Tee beim Zählen)
  await c.bw('holzbesen', 'O', -19.0, { lehnen: .1, r: .5, ry: -PI / 2, at: 31.7 });                            // Hauswirtschaft
  await c.A('wecker', 23.3, -21.5, { r: .3, min: Y + .5, max: Y + 1.0 }); await c.b('koffer', 25.0, -20.8, { r: .4, ry: .3 });          // Schlafzimmer
  c.fleck('grime', 1.2, .8, 23.0, Y + .026, -13.0, 'floor', .2, 0x2a2420, .5);                    // Fußspuren an der Haustür
  S.fertig(); };

// ================= Nr. 1 · Elternhaus Brandt (seit 2009 zu): Küche SW, Wohnzimmer SO, Kinderzimmer NW, Elternschlafzimmer NO – Staub über allem
RD.bau.nr1 = async c => { const Y = c.y0, S = rd_sammler(c);
  rd_haus(c, Y, [
    { x0: -55.7, x1: -50.1, z0: -16.9, z1: -12.3, boden: 'linoleum_brown', tile: 1.3, tint: 0xa8a090 },      // Küche
    { x0: -49.9, x1: -44.3, z0: -16.9, z1: -12.3, boden: 'wood_floor_worn', tile: 1.5, tint: 0xa8a090 },     // Wohnzimmer
    { x0: -55.7, x1: -50.1, z0: -21.7, z1: -17.1, boden: 'plank_flooring_03', tile: 1.5, tint: 0xa8a090 },   // Kinderzimmer
    { x0: -49.9, x1: -44.3, z0: -21.7, z1: -17.1, boden: 'old_wooden_floor_02', tile: 1.5, tint: 0xa8a090 }], // Schlafzimmer
    [{ ax: 'x', at: -17.0, pos: -53.0, w: 1.0 }, { ax: 'x', at: -17.0, pos: -47.0, w: 1.0 }, { ax: 'z', at: -50.0, pos: -14.5, w: 1.1 }], { tint: 0xcfc8b8 });
  await c.A('vase2', -48.5, -16.4, { r: .4, min: Y + .8, max: Y + 1.5 });                                     // Vase auf der Anrichte, Blumen längst vertrocknet
  await c.b('pflanze', -45.0, -12.8, { r: .3 }); await c.b('schaukel', -45.6, -15.0, { r: .5, ry: PI * .7 });  // Mamas Schaukelstuhl am Wohnzimmerfenster
  await c.A('kessel', -54.2, -12.6, { r: .4, min: Y + .7, max: Y + 1.2 }); await c.b('holzhocker', -52.7, -15.2, { r: .4 });
  await c.b('korb', -51.0, -20.8, { r: .4 });                                                              // Kinderzimmer: Spielzeugkorb
  await c.b('koffer', -45.0, -18.0, { r: .4, ry: .5 });
  S.fertig(); };

// ================= Nr. 4 · Oma Ernas Haus (Erdgeschoss): bis unter die Decke voll – Deckchen, Porzellan, Zettel; Küche NW, Schlafzimmer NO, Flur SW, Stube SO
RD.bau.nr4 = async c => { const Y = 0, S = rd_sammler(c);
  rd_haus(c, Y, [
    { x0: -1405.8, x1: -1400.06, z0: 1395.2, z1: 1399.94, boden: 'linoleum_brown', tile: 1.3, tint: 0xb8b0a0 },  // Küche
    { x0: -1399.94, x1: -1394.2, z0: 1395.2, z1: 1399.94 },  // Schlafzimmer (Dielen vorhanden: nur Leisten)
    { x0: -1405.8, x1: -1400.06, z0: 1400.06, z1: 1404.8 }, { x0: -1399.94, x1: -1394.2, z0: 1400.06, z1: 1404.8 }],
    [{ ax: 'x', at: 1400.0, pos: -1403.0, w: 1.0 }, { ax: 'x', at: 1400.0, pos: -1397.0, w: 1.0 }, { ax: 'z', at: -1400.0, pos: 1402.5, w: 1.1 }], { fy: .012 });
  // Küche (NW): Porzellan und Töpfe, Besen, Eimer; Bild und Wandzettel über der Eckbank
  await c.A('teeset', -1403.0, 1397.2, { r: .6, min: .6, max: 1.1 }); await c.A('kessel', -1405.0, 1396.3, { r: .5, min: .6, max: 1.2 });
  await c.b('holzeimer', -1401.0, 1395.7, { r: .4 }); await c.bw('holzbesen', 'W', 1399.0, { lehnen: .1, r: .5, ry: PI / 2 });
  await c.w('bild1', 'S', -1402.7, 1.75, { r: .6 }); await c.w('wanduhr', 'S', -1401.2, 2.0, { r: .5 });
  c.papier('zettel', .12, .17, -1404.0, 1.45, 1395.115, { rx: 0, ry: 0, rz: .04 }); c.papier('zettel', .12, .17, -1402.0, 1.3, 1395.115, { rx: 0, ry: 0, rz: -.05 });
  // Schlafzimmer (NO): Bilder über dem Bett, Rahmen, Wecker – Omas Fotos von Erna und Walter
  await c.w('zierrahmen', 'S', -1397.0, 1.8, { r: .6 }); await c.w('bild2', 'S', -1395.4, 1.7, { r: .5 }); await c.w('bild1', 'O', 1398.0, 1.7, { r: .5 });
  await c.A('wecker', -1396.2, 1396.0, { r: .8, min: .3, max: 1.1 }); await c.b('koffer', -1399.0, 1396.0, { r: .5, ry: .2 });
  c.papier('zettel', .12, .17, -1394.115, 1.35, 1399.0, { rx: 0, ry: -PI / 2, rz: .06 });
  // Flur (SW): Spiegel, Garderobe, Stiefel
  await c.w('spiegel', 'N', -1403.0, 1.6, { r: .5 }); await c.w('bild2', 'N', -1401.4, 1.7, { r: .4 }); await c.b('gummistiefel', -1404.8, 1404.2, { r: .4, ry: .3 });
  c.papier('zettel', .12, .17, -1402.0, 1.25, 1404.885, { rx: 0, ry: PI, rz: -.03 });
  // Stube (SO): Omas Sammlung – Vasen, Rahmen, Pflanze, Schaukelstuhl, Standuhr, Bilder
  await c.A('vase1', -1395.0, 1403.0, { r: .8, min: .5, max: 1.3 }); await c.A('stehrahmen1', -1396.2, 1404.3, { r: .8, min: .5, max: 1.3 });
  await c.b('pflanze', -1395.0, 1404.4, { r: .4 }); await c.b('schaukel', -1396.5, 1401.0, { r: .5, ry: -PI * .8 });
  await c.w('zierrahmen', 'N', -1398.3, 1.8, { r: .6 }); await c.w('bild2', 'N', -1396.0, 1.7, { r: .6 }); await c.w('spiegel', 'O', 1402.0, 1.6, { r: .6 });
  c.papier('zettel', .12, .17, -1394.115, 1.3, 1403.4, { rx: 0, ry: -PI / 2, rz: .03 });
  // weitere Alltagsdinge: Nachttisch am Bett, Telefontischchen im Flur, Beistelltisch neben dem Sofa – jedes mit etwas darauf
  await c.b('nachttisch', -1394.9, 1398.1, { r: .4, ry: -PI / 2 }); await c.A('stehrahmen2', -1394.9, 1398.1, { r: .2, min: .4, max: .8, ry: -PI / 2 + .3 });
  await c.b('kleintisch', -1401.2, 1404.3, { r: .4 }); await c.A('telefon', -1401.2, 1404.3, { r: .2, min: .4, max: .9 });
  await c.b('beistelltisch', -1398.2, 1403.8, { r: .5 }); await c.A('vase4', -1398.2, 1403.8, { r: .2, min: .4, max: .8 });
  S.fertig(); };

// ================= Nr. 4 oben: Lukes Jugendzimmer (2016) und Bad – Fliesen im Bad
RD.bau.nr4_og = async c => { const S = rd_sammler(c);
  rd_haus(c, 0, [{ x0: -1403.4, x1: -1398.66, z0: 1424.2, z1: 1427.8 }, { x0: -1398.54, x1: -1396.6, z0: 1424.2, z1: 1427.8, boden: 'interior_tiles', tile: 1.0 }],
    [{ ax: 'z', at: -1398.6, pos: 1427.3, w: 1.1 }], { fy: .012 });
  await c.b('phocker', -1401.0, 1425.2, { r: .5 }); await c.A('wecker', -1402.8, 1425.4, { r: .6, min: .4, max: 1.1 }); await c.b('korb', -1399.4, 1427.2, { r: .4 });
  S.fertig(); };

// ================= Nr. 4 Keller: Pfandkisten, Einmachgläser, Werkzeug
RD.bau.nr4_keller = async c => { const S = rd_sammler(c);
  await c.b('kiste', -1398.3, 1444.4, { r: .6 }); await c.b('werkzeugkiste', -1402.0, 1447.7, { r: .5, ry: .2 }); await c.b('karton', -1400.0, 1444.0, { r: .5 }); await c.b('holzeimer', -1402.3, 1444.2, { r: .4 });
  S.fertig(); };

// ================= Giselas Haus: Küche W, Stube O – siebzehn Näpfe, alle Uhren auf 3:13
RD.bau.gisela = async c => { const S = rd_sammler(c);
  rd_haus(c, 0, [{ x0: -1444.3, x1: -1439.06, z0: 1396.7, z1: 1403.3, boden: 'old_linoleum_flooring_01', tile: 1.3, tint: 0xb0a898 }, { x0: -1438.94, x1: -1435.7, z0: 1396.7, z1: 1403.3 }],
    [{ ax: 'z', at: -1439.0, pos: 1401.6, w: 1.0 }], { fy: .012 });
  await c.A('kessel', -1443.0, 1397.6, { r: .6, min: .7, max: 1.2 }); await c.A('vase2', -1436.5, 1397.5, { r: .8, min: .4, max: 1.3 });
  await c.b('korb', -1437.2, 1402.5, { r: .4 }); await c.b('pflanze', -1436.0, 1403.0, { r: .3 }); await c.b('holzhocker', -1441.5, 1402.7, { r: .4 });
  S.fertig(); };

// ================= Pfarrhaus, Studierzimmer: Voss' Schreibtisch, Bücherregale, Kreuz – das Licht macht Gisela jeden Abend an
RD.bau.pfarrhaus = async c => { const S = rd_sammler(c);
  rd_haus(c, 0, [{ x0: -1443.8, x1: -1436.2, z0: 1437.2, z1: 1442.8 }], [], { fy: .012 });
  await c.A('oellampe', -1440.5, 1438.6, { r: 1.0, min: .6, max: 1.1 }); await c.b('pflanze', -1437.0, 1441.9, { r: .4 }); await c.b('esstuhl', -1439.0, 1440.0, { r: .5, ry: .6 }); await c.b('koffer', -1442.5, 1442.0, { r: .4, ry: .4 });
  S.fertig(); };
