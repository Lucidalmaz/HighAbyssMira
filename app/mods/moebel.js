// =====================================================================  MÖBEL (Modul „moebel“, Nutzer-Rückmeldung 02.10.2026: „viele Schränke haben keine sichtbare Tür“)
// Im Grundspiel stehen noch nackte Kästen als Schränke (Archiv im Amt, Kommode Nr. 1, Villa). Sie werden ausgeblendet (Kollision bleibt) und durch die gescannten
// Möbel ersetzt: Kleiderschrank (Fab „wardrobe“: Türen, Griffe, Sockel) bzw. Kommode („dresser“: Schubladen). Größe aus dem Kasten (Höhe genau, Breite/Tiefe ±12 %),
// Vorderseite zur freien Seite (dort, wo im Raum Platz ist). Der Kühlschrank in Nr. 7 bleibt vorerst (kein Kühlschrank-Scan vorhanden – Nutzer: Fab).
const MOEBEL_ZIEL = [ // [x, z, Breite, Höhe, Tiefe, Modell] (gemessen im Spiel, Mitte der Grundfläche)
  [-48.6, -16.6, 1.57, 1.27, .67, 'dresser'],
  ...[620, 622, 624, 626, 628].map(x => [C2.x + x - 600, C2.z - 5.6, 1.0, 2.2, .5, 'wardrobe']),
  ...[621, 623, 625, 627].map(x => [C2.x + x - 600, C2.z + 5.6, 1.0, 2.2, .5, 'wardrobe']),
  [-1444.1, 1402.4, .62, 1.52, .62, 'wardrobe'], [-1400.5, 1395.5, .66, 1.62, .64, 'wardrobe']];
const moebel_S = { n: 0, weg: [] };
async function moebel_bau() {
  const W_ = n => ({ b: 'T_' + n + '_BaseColor.jpg', n: 'T_' + n + '_Normal.jpg', r: 'T_' + n + '_Roughness.jpg', ao: 'T_' + n + '_Ao.jpg' });
  const M0 = {}; try { M0.wardrobe = await msModel('wardrobe'); } catch (e) { console.warn('Möbel: Modell wardrobe', e); }
  try { M0.dresser = await msFBX('dresser', 'model.fbx', { 'Wood-1': W_('Wood-1'), 'Wood-2': W_('Wood-2'), 'Wood-3': W_('Wood-3'), Metal: { ...W_('Metal'), m: 'T_Metal_Metallic.jpg' } }); } catch (e) { console.warn('Möbel: Modell dresser', e); }
  const B = new THREE.Box3(), sz = new THREE.Vector3(), cands = [];
  scene.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === 'BoxGeometry' && o.visible) cands.push(o); });
  for (const [x, z, w, h, d, key] of MOEBEL_ZIEL) {
    const src = M0[key]; if (!src) continue;
    const box_ = cands.find(o => { B.setFromObject(o); B.getSize(sz); const cx = (B.min.x + B.max.x) / 2, cz = (B.min.z + B.max.z) / 2; return Math.abs(cx - x) < .15 && Math.abs(cz - z) < .15 && Math.abs(sz.y - h) < .08; }); if (!box_) continue;
    B.setFromObject(box_); B.getSize(sz); const alongX = sz.x >= sz.z, cx = (B.min.x + B.max.x) / 2, cz = (B.min.z + B.max.z) / 2, y0 = B.min.y;
    // Vorderseite: die Seite mit mehr freiem Raum davor
    const frei = (dx, dz) => { let n = 0; for (let k = 1; k <= 6; k++) if (typeof mantleFree === 'function' ? mantleFree(cx + dx * (k * .25 + (alongX ? sz.z : sz.x) / 2), cz + dz * (k * .25 + (alongX ? sz.z : sz.x) / 2), y0) : true) n++; else break; return n; };
    const sides = alongX ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]], f = frei(...sides[0]) >= frei(...sides[1]) ? sides[0] : sides[1];
    const m = src.clone(true), g = new THREE.Group(); g.add(m); m.updateMatrixWorld(true); const mb = new THREE.Box3().setFromObject(m), ms = mb.getSize(new THREE.Vector3());
    const sH = sz.y / ms.y, sW = THREE.MathUtils.clamp((alongX ? sz.x : sz.z) / ms.x, sH * .88, sH * 1.12), sD = THREE.MathUtils.clamp((alongX ? sz.z : sz.x) / ms.z, sH * .88, sH * 1.12);
    m.scale.multiply(new THREE.Vector3(sW, sH, sD)); m.updateMatrixWorld(true); const mb2 = new THREE.Box3().setFromObject(m); m.position.sub(new THREE.Vector3((mb2.min.x + mb2.max.x) / 2, mb2.min.y, (mb2.min.z + mb2.max.z) / 2));
    g.position.set(cx, y0, cz); g.rotation.y = Math.atan2(f[0], f[1]); // Modell schaut nach +z → Drehung zur freien Seite
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(g);
    box_.visible = false; moebel_S.weg.push(box_); moebel_S.n++; } // Kollision des Kastens bleibt (gleiche Grundfläche)
}
WORLD_MODS.push(['Möbel', async () => { try { await moebel_bau(); } catch (e) { console.warn('Möbel', e); } }]);
window.__moebel = { S: moebel_S }; // Testzugriff
