// =====================================================================  LATERNEN (Modul „laternen“): Birne, Lichtkegel und Lichtpool sitzen am ECHTEN Kopf der Laternen
// Nutzer 07.10.: „die Lampen sehen oben aus wie eine schwebende Platte, auf der der Rabe sitzt – alles soll geschlossen und natürlich aussehen“.
// Ursache: lamp() (Basis) setzt die Birne 1,7 m vom Mast weg; das Scan-Modell der Laterne (assets/lamp) hat aber einen viel kürzeren Ausleger. Die leuchtende Birnenplatte,
// der Kegel und der Lichtpool hingen deshalb frei in der Luft neben dem Kopf. Hier wird nach dem Einsetzen des Modells die Lage aus dessen Hüllkörper gemessen:
// Birne direkt unter den Leuchtenkopf (flach an die Unterseite), Kegel, Pool und Lichtpunkt (wx/wz, tx/tz) folgen. Gilt für alle Laternen (Ort, Ost/West, spätere).
const laternen_S = { n: 0, t: 0 };
const laternen_V = new THREE.Vector3();
let laternen_haloTex = null;
function laternen_halo() { if (laternen_haloTex) return laternen_haloTex; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,214,150,.85)'); g.addColorStop(.25, 'rgba(255,190,110,.35)'); g.addColorStop(.6, 'rgba(255,170,90,.08)'); g.addColorStop(1, 'rgba(255,160,80,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return laternen_haloTex = new THREE.CanvasTexture(c); }
// Messung am echten Scan-Kopf (Eckpunkte in Weltlage): Kopf = höchste 0,9 m am äußersten Ende des Auslegers. Die leuchtende Scheibe sitzt vollständig INNERHALB der Schale
// (60 % der Innenmaße), bündig mit der Unterkante (knapp darüber), Halo nur als weicher Sprite darunter. Gilt für Ausrichtung gerade/schräg, Ort und Ost/West.
function laternen_anpassen(L) {
  if (L.kopf || !L.g) return false; const m = L.g.children.find(c => c !== L.bulb && c !== L.cone && c !== L.halo && c.visible); if (!m) return false; // noch ohne Modell (procedural) → später
  L.g.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(m), gx = L.g.position.x, gz = L.g.position.z, ax = L.ax || 0, az = L.az || 0; if (!isFinite(bb.max.y) || bb.max.y < 3) return false;
  const V = laternen_V, pts = []; let far = -1e9;
  m.traverse(o => { if (!o.isMesh || !o.geometry.attributes.position) return; const P = o.geometry.attributes.position; o.updateWorldMatrix(true, false);
    for (let i = 0; i < P.count; i += 2) { V.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); if (V.y < bb.max.y - .9) continue; const al = (V.x - gx) * ax + (V.z - gz) * az; pts.push(al, (V.x - gx) * -az + (V.z - gz) * ax, V.y); if (al > far) far = al; } });
  if (pts.length < 30) return false;
  let a0 = 1e9, a1 = -1e9, l0 = 1e9, l1 = -1e9, y0 = 1e9; const lim = far - 1.1; // Kopf: äußerstes Stück des Auslegers
  for (let i = 0; i < pts.length; i += 3) if (pts[i] > lim) { a0 = Math.min(a0, pts[i]); a1 = Math.max(a1, pts[i]); l0 = Math.min(l0, pts[i + 1]); l1 = Math.max(l1, pts[i + 1]); y0 = Math.min(y0, pts[i + 2]); }
  const ac = (a0 + a1) / 2, lc = (l0 + l1) / 2, wA = Math.max(.12, (a1 - a0) * .6), wL = Math.max(.12, (l1 - l0) * .6), yU = y0 + .03;
  const hx = ax * ac + -az * lc, hz = az * ac + ax * lc; // Kopfmitte relativ zum Mast (Welt = lokal, Gruppe nur verschoben)
  const bg = new THREE.CircleGeometry(.5, 28); bg.rotateX(Math.PI / 2); L.bulb.geometry.dispose(); L.bulb.geometry = bg; L.bulb.scale.set(ax ? wA : wL, 1, ax ? wL : wA); L.bulb.material.side = THREE.DoubleSide;
  L.bulb.position.set(hx, yU, hz); L.bulb.visible = true; L.cone.position.set(hx, yU - 2.5, hz);
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: laternen_halo(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 })); h.scale.setScalar(Math.max(wA, wL) * 3.4); h.position.set(hx, yU - .05, hz); h.renderOrder = 7; h.userData.noCol = true; L.g.add(h); L.halo = h;
  if (L.decal) L.decal.position.set(gx + hx + ax * .6, L.decal.position.y, gz + hz + az * .6);
  L.wx = gx + hx; L.wz = gz + hz; L.tx = L.wx + ax * .6; L.tz = L.wz + az * .6; L.kopf = Math.max(.35, ac); laternen_S.n++; laternen_S.mass = [ac, lc, a1 - a0, l1 - l0, y0]; return true; }
function laternen_alle() { for (const L of lamps) laternen_anpassen(L); }
WORLD_MODS.push(['Laternen', async () => { laternen_alle(); }]);
WORLD_TICK.push((dt) => { if (!state.started) return; for (const L of lamps) if (L.halo) { L.halo.visible = L.bulb.visible; L.halo.material.opacity = Math.min(1, L.k) * .75; } laternen_S.t -= dt; if (laternen_S.t > 0) return; laternen_S.t = 2; laternen_alle(); }); // später gebaute Laternen (Kapitel-Module) nachziehen
// Verandalampen (Basis: nackte Kugel): Wandhalter + Schirm (Kappe) um die Birne, Glow als weicher Halo-Sprite
function laternen_veranda() { if (typeof porchLights === 'undefined') return; for (const P of porchLights) { if (P.schirm || !P.bulb || !P.bulb.parent) continue; const g = P.bulb.parent, p = P.bulb.position, T = THREE;
    const met = new T.MeshStandardMaterial({ color: 0x23211f, roughness: .55, metalness: .6 }), cap = new T.Mesh(new T.CylinderGeometry(.075, .13, .09, 16, 1, true), met); cap.material.side = T.DoubleSide; cap.position.set(p.x, p.y + .07, p.z); cap.userData.noCol = true; g.add(cap);
    const top = new T.Mesh(new T.CircleGeometry(.075, 16), met); top.rotation.x = -Math.PI / 2; top.position.set(p.x, p.y + .115, p.z); g.add(top);
    const arm = new T.Mesh(new T.BoxGeometry(.03, .03, .5), met); arm.position.set(p.x, p.y + .115, p.z - .25); arm.userData.noCol = true; g.add(arm);
    P.bulb.scale.set(.8, .8, .8); P.bulb.position.y -= .01;
    const h = new T.Sprite(new T.SpriteMaterial({ map: laternen_halo(), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false, opacity: .6 })); h.scale.setScalar(.7); h.position.copy(P.bulb.position); h.renderOrder = 7; h.userData.noCol = true; g.add(h); P.halo = h; P.schirm = cap; } }
WORLD_MODS.push(['Verandalampen', async () => { try { laternen_veranda(); } catch (e) { console.warn('Verandalampen', e); } }]);
WORLD_TICK.push(() => { if (typeof porchLights === 'undefined') return; for (const P of porchLights) if (P.halo) P.halo.material.opacity = Math.min(1, P.bulb.material.emissiveIntensity / 6) * .6; });
window.__laternen = { S: laternen_S, alle: laternen_alle }; // Testzugriff
