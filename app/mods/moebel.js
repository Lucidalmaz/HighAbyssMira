// =====================================================================  MÖBEL (Modul „moebel“, Nutzer-Rückmeldung 02.10.2026: „viele Schränke haben keine sichtbare Tür“)
// Im Grundspiel stehen noch nackte Kästen als Schränke (Archiv im Amt, Kommode Nr. 1, Villa). Sie werden ausgeblendet (Kollision bleibt) und durch die gescannten
// Möbel ersetzt: Kleiderschrank (Fab „wardrobe“: Türen, Griffe, Sockel) bzw. Kommode („dresser“: Schubladen). Größe aus dem Kasten (Höhe genau, Breite/Tiefe ±12 %),
// Vorderseite zur freien Seite (dort, wo im Raum Platz ist). Kühlschrank Nr. 7 bleibt vorerst (das Fab-Modell „Fridge - Refrigerator - Freezer“ liegt offen auf dem Rücken – unbrauchbar).
const MOEBEL_ZIEL = [ // [x, z, Breite, Höhe, Tiefe, Modell] (gemessen im Spiel, Mitte der Grundfläche)
  [-48.6, -16.6, 1.57, 1.27, .67, 'dresser'],
  // 08.10.2026: Archiv Kap. 2 = Metall-Archivschränke mit Flügeltüren (eigene Arbeit, Blender: tools/blender/schrank_bau.py) statt Holz-Kleiderschrank
  ...[620, 622, 624, 626, 628].map(x => [C2.x + x - 600, C2.z - 5.6, 1.0, 2.2, .5, 'archiv']),
  ...[621, 623, 625, 627].map(x => [C2.x + x - 600, C2.z + 5.6, 1.0, 2.2, .5, 'archiv']),
  [-1444.1, 1402.4, .62, 1.52, .62, 'wardrobe'], [-1400.5, 1395.5, .66, 1.62, .64, 'wardrobe']];
const moebel_S = { n: 0, weg: [] };
async function moebel_bau() {
  const W_ = n => ({ b: 'T_' + n + '_BaseColor.jpg', n: 'T_' + n + '_Normal.jpg', r: 'T_' + n + '_Roughness.jpg', ao: 'T_' + n + '_Ao.jpg' });
  const M0 = {}; try { M0.wardrobe = await msModel('wardrobe'); } catch (e) { console.warn('Möbel: Modell wardrobe', e); }
  try { M0.archivV = await Promise.all(['archiv_grau.glb', 'archiv_gruen.glb'].map(f => msModel('aktenschrank', f))); M0.archiv = M0.archivV[0]; } catch (e) { console.warn('Möbel: Archivschrank', e); M0.archiv = M0.wardrobe; M0.archivAlt = true; }
  try { M0.dresser = await msFBX('dresser', 'model.fbx', { 'Wood-1': W_('Wood-1'), 'Wood-2': W_('Wood-2'), 'Wood-3': W_('Wood-3'), Metal: { ...W_('Metal'), m: 'T_Metal_Metallic.jpg' } }); } catch (e) { console.warn('Möbel: Modell dresser', e); }
  const B = new THREE.Box3(), sz = new THREE.Vector3(), cands = [];
  scene.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === 'BoxGeometry' && o.visible) cands.push(o); });
  let ai = 0;
  for (const [x, z, w, h, d, key0] of MOEBEL_ZIEL) {
    const key = key0 === 'archiv' && M0.archivAlt ? 'wardrobe' : key0; const src = key0 === 'archiv' && M0.archivV ? M0.archivV[ai++ % 2] : M0[key]; if (!src) continue;
    const box_ = cands.find(o => { B.setFromObject(o); B.getSize(sz); const cx = (B.min.x + B.max.x) / 2, cz = (B.min.z + B.max.z) / 2; return Math.abs(cx - x) < .15 && Math.abs(cz - z) < .15 && Math.abs(sz.y - h) < .08; }); if (!box_) continue;
    B.setFromObject(box_); B.getSize(sz); const alongX = sz.x >= sz.z, cx = (B.min.x + B.max.x) / 2, cz = (B.min.z + B.max.z) / 2, y0 = B.min.y;
    // Vorderseite: die Seite mit mehr freiem Raum davor
    const frei = (dx, dz) => { let n = 0; for (let k = 1; k <= 6; k++) if (typeof mantleFree === 'function' ? mantleFree(cx + dx * (k * .25 + (alongX ? sz.z : sz.x) / 2), cz + dz * (k * .25 + (alongX ? sz.z : sz.x) / 2), y0) : true) n++; else break; return n; };
    const sides = alongX ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]], f = frei(...sides[0]) >= frei(...sides[1]) ? sides[0] : sides[1];
    const m = src.clone(true), g = new THREE.Group(); g.add(m); m.updateMatrixWorld(true); const mb = new THREE.Box3().setFromObject(m), ms = mb.getSize(new THREE.Vector3());
    // Achsen der Modelle (gemessen): Fab „wardrobe“ ist entlang z breit (1,52 m) und nur 0,5 m tief, Vorderseite +x; „dresser“ ist entlang x breit, Vorderseite +z.
    // Vorher galt für beide „breit entlang x, schaut nach +z“: die Schränke im Archiv standen quer zur Wand (Seitenansicht, 1,5 m tief in den Gang).
    const wd = key === 'wardrobe', aw = wd ? 'z' : 'x', ad = wd ? 'x' : 'z';
    const sH = sz.y / ms.y, sW = THREE.MathUtils.clamp((alongX ? sz.x : sz.z) / ms[aw], sH * (wd ? .55 : .88), sH * 1.12), sD = THREE.MathUtils.clamp((alongX ? sz.z : sz.x) / ms[ad], sH * .88, sH * 1.12);
    const sc_ = new THREE.Vector3(); sc_[aw] = sW; sc_[ad] = sD; sc_.y = sH; m.scale.multiply(sc_); m.updateMatrixWorld(true); const mb2 = new THREE.Box3().setFromObject(m); m.position.sub(new THREE.Vector3((mb2.min.x + mb2.max.x) / 2, mb2.min.y, (mb2.min.z + mb2.max.z) / 2));
    g.position.set(cx, y0, cz); g.rotation.y = wd ? Math.atan2(-f[1], f[0]) : Math.atan2(f[0], f[1]); // dresser schaut nach +z, wardrobe nach +x → Drehung zur freien Seite
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(g);
    if (key === 'kuehlschrank' && typeof fridgeNote !== 'undefined') { g.updateMatrixWorld(true); const fb = new THREE.Box3().setFromObject(g); fridgeNote.position.x = fb.min.x - .006; } // Zettel liegt auf der echten Tür
    box_.visible = false; moebel_S.weg.push(box_); moebel_S.n++; moebel_S[key] = g; } // Kollision des Kastens bleibt (gleiche Grundfläche)
}
WORLD_MODS.push(['Möbel', async () => { try { await moebel_bau(); } catch (e) { console.warn('Möbel', e); } }]);
window.__moebel = { S: moebel_S }; // Testzugriff
