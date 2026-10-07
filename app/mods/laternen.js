// =====================================================================  LATERNEN (Modul „laternen“): Birne, Lichtkegel und Lichtpool sitzen am ECHTEN Kopf der Laternen
// Nutzer 07.10.: „die Lampen sehen oben aus wie eine schwebende Platte, auf der der Rabe sitzt – alles soll geschlossen und natürlich aussehen“.
// Ursache: lamp() (Basis) setzt die Birne 1,7 m vom Mast weg; das Scan-Modell der Laterne (assets/lamp) hat aber einen viel kürzeren Ausleger. Die leuchtende Birnenplatte,
// der Kegel und der Lichtpool hingen deshalb frei in der Luft neben dem Kopf. Hier wird nach dem Einsetzen des Modells die Lage aus dessen Hüllkörper gemessen:
// Birne direkt unter den Leuchtenkopf (flach an die Unterseite), Kegel, Pool und Lichtpunkt (wx/wz, tx/tz) folgen. Gilt für alle Laternen (Ort, Ost/West, spätere).
const laternen_S = { n: 0, t: 0 };
function laternen_anpassen(L) {
  if (L.kopf || !L.g) return false; const m = L.g.children.find(c => c !== L.bulb && c !== L.cone && c.visible); if (!m) return false; // noch ohne Modell (procedural) → später
  L.g.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(m), gx = L.g.position.x, gz = L.g.position.z, ax = L.ax || 0, az = L.az || 0; if (!isFinite(bb.max.y) || bb.max.y < 3) return false;
  const far = ax ? (ax > 0 ? bb.max.x - gx : gx - bb.min.x) : (az > 0 ? bb.max.z - gz : gz - bb.min.z), d = Math.max(.35, far - .3), hx = ax * d, hz = az * d, yUnter = Math.max(4.6, bb.max.y - .2);
  L.bulb.position.set(hx, yUnter, hz); L.bulb.visible = true; L.cone.position.set(hx, yUnter - 2.5, hz);
  if (L.decal) L.decal.position.set(gx + hx + ax * .6, L.decal.position.y, gz + hz + az * .6);
  L.wx = gx + hx; L.wz = gz + hz; L.tx = L.wx + ax * .6; L.tz = L.wz + az * .6; L.kopf = d; laternen_S.n++; return true; }
function laternen_alle() { for (const L of lamps) laternen_anpassen(L); }
WORLD_MODS.push(['Laternen', async () => { laternen_alle(); }]);
WORLD_TICK.push((dt) => { if (!state.started) return; laternen_S.t -= dt; if (laternen_S.t > 0) return; laternen_S.t = 2; laternen_alle(); }); // später gebaute Laternen (Kapitel-Module) nachziehen
window.__laternen = { S: laternen_S, alle: laternen_alle }; // Testzugriff
