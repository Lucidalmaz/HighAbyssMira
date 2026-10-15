// =====================================================================  STREAM (Modul „stream“, 12.10.2026, Architektur-Block Grafikspeicher/Ladezeit)
// Texturen nach Abstand streamen („Mip-Fenster“): Gemessen (Kreuzung, Menü): 6,1 GB Grafikspeicher, davon ≈ 2,7 GB Texturen + 1,25 GB Formen, obwohl bei Blick in alle Richtungen
// (nach Verwerfen aller Ressourcen) nur 2,8 GB Gesamtbedarf entstehen. Der Nebel (Dichte 0,034) schluckt ab ≈ 55 m > 97 %, und jede Textur braucht ihre feinen Mip-Stufen nur
// in der Nähe: ein 2048²-Bild auf einem 2-m-Objekt hat in 12 m Abstand mehr als zwei Texel je Pixel auf der 256²-Stufe.
// Prinzip (wie virtuelles Texturieren, nur je Textur):
//  · Je KTX-Quelle (Textur mit __kre aus KTXF der Basis) wird die Texeldichte je Besitzer-Form bestimmt (Breite × UV-Spanne × Wiederholung / größte Weltausdehnung).
//  · Alle 0,5 s (zeitscheibenweise, ≤ 1,5 ms je Bild): benötigte Stufe je Textur = schärfste Anforderung über alle Besitzer aus Abstand (Kamera/Spieler) und Bildschirmdichte
//    (1 m in Abstand d = H / (2 tan(fov/2) d) Pixel, mal Reserve STR.M). Verborgene Besitzer (Innenräume) zählen bis STR.RH mit Vorsprung STR.HO.
//  · Das GPU-Fenster ist ein Teil der Mip-Kette ab Stufe k (t.mipmaps = Kette.slice(k); dispose → neuer Upload). Stufen ≤ KEEPW px bleiben als CPU-Kopie immer im Speicher
//    (≈ 2 %), darum ist jede Herabstufung sofort und jede Hochstufung bis dorthin ohne Warten; feinere Stufen kommen aus ktxRestore (Datei → Umwandlung) im Hintergrund,
//    bis dahin zeigt das Teil die schärfste vorhandene Stufe (nie schwarz).
//  · Lade-Zeit: das Fenster für die Startposition wird VOR dem Hochladen gesetzt (die Basis lädt dann nur Fenster hoch, siehe stream_patch.py).
// Ausgenommen: Texturen ohne __kre (nicht wiederherstellbar), Ketten < 3 Stufen, Quellen ohne bekannte Besitzer. Aus: ?nostream. Zahlen: window.__stream
const STR = { HOLD: 8000, off: /[?&]nostream/.test(location.search) || (typeof LITE !== 'undefined' && LITE), KEEPW: 256, M: +(/[?&]strm=([\d.]+)/.exec(location.search) || [])[1] || 1.5, RH: 26, HO: 8,
  maxBusy: 14, apMs: 2.2, recs: new Map(), list: [], rq: [], pendUp: 0, infoMap: new WeakMap(), suM: new WeakMap(), suG: new WeakMap(), shG: new WeakMap(), sdG: new WeakMap(), uG: new WeakMap(), regM: new WeakSet(), cv: !/[?&]nocv/.test(location.search), cvs: new Map(), cvl: [], nCvEv: 0, nCvUp: 0, cvEvMB: 0, geo: !/[?&]nogeo/.test(location.search), geos: new Map(), glist: [], idle: /[?&]stridle/.test(location.search), RG: 76, RGH: 34, RGS: 50, geoIdle: 6000, RC: 130, RCH: 60, cs: /[?&]subset/.test(location.search), nGeoEv: 0, nGeoUp: 0, geoEvMB: 0, mats: new Set(), unreg: [], now: 0, ready: false, sweepId: 0, ms: 0, sweepMs: 0, scanMs: 0, nUp: 0, nDown: 0, nRestore: 0, nUpload: 0,
  hitchMs: 0, pend: new Set(), t0: 0, lastScan: 0, scanning: false, log: [], err: null };
const STR_P = new THREE.Vector3(), STR_C = new THREE.Vector3();
function str_geoU(g) { // UV-Spanne einer Form (wie vram_diet, gemeinsam zwischengespeichert)
  { const c = STR.uG.get(g); if (c !== undefined) return c; } if (typeof VRAM_U !== 'undefined') { const c = VRAM_U.get(g); if (c !== undefined) { STR.uG.set(g, c); return c; } } let u = 1;
  try { const uv = g.attributes && g.attributes.uv; if (uv && uv.array && uv.count) { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; const A = uv.array, st = uv.itemSize || 2, step = Math.max(1, Math.floor(uv.count / 20000));
      for (let i = 0; i < uv.count; i += step) { const x = A[i * st], y = A[i * st + 1]; if (x < a) a = x; if (x > b) b = x; if (y < c) c = y; if (y > d) d = y; }
      u = Math.max(.05, Math.min(64, Math.max(b - a, d - c))); } } catch (e) {}
  STR.uG.set(g, u); return u; }
function str_meshInfo(o) { // Hülle und Größe einer Form (Weltmaßstab), zwischengespeichert in STR.infoMap (keine eigenen Eigenschaften an three.js-Objekten: sie erzeugten je nach Reihenfolge viele Objektformen)
  let info = STR.infoMap.get(o); if (info && info.sc === STR.scanId) return info; const g = o.geometry;
  if (!info) { info = { o, lx: 0, ly: 0, lz: 0, r: 1, L: 1, u: 1, inst: null, sw: -1, d: 1e9, dx: 1e9, st: 1, rs: 1, dyn: !!o.isSkinnedMesh, sc: -1 }; STR.infoMap.set(o, info); }
  if (!g.boundingSphere) g.computeBoundingSphere(); if (!g.boundingBox) g.computeBoundingBox();
  const bs = g.boundingSphere, bb = g.boundingBox; info.u = str_geoU(g);
  const e = o.matrixWorld.elements; let sc = Math.sqrt(Math.max(e[0] * e[0] + e[1] * e[1] + e[2] * e[2], e[4] * e[4] + e[5] * e[5] + e[6] * e[6], e[8] * e[8] + e[9] * e[9] + e[10] * e[10])) || 1;
  const sx = bb.max.x - bb.min.x, sy = bb.max.y - bb.min.y, sz = bb.max.z - bb.min.z; let L = Math.max(sx, sy, sz);
  if (o.isInstancedMesh && o.instanceMatrix && o.instanceMatrix.array && o.count > 0) {
    const A = o.instanceMatrix.array, n = Math.min(o.count, 6000), stp = Math.max(1, Math.floor(o.count / n)); let m = 0; const xs = [], ys = [], zs = [];
    for (let i = 0; i < o.count; i += stp) { const k = i * 16; m = Math.max(m, Math.hypot(A[k], A[k + 1], A[k + 2]), Math.hypot(A[k + 4], A[k + 5], A[k + 6]), Math.hypot(A[k + 8], A[k + 9], A[k + 10]));
      const lx = bs.center.x, ly = bs.center.y, lz = bs.center.z; // Mittelpunkt der Form in Instanz- und Weltraum
      const ix = A[k] * lx + A[k + 4] * ly + A[k + 8] * lz + A[k + 12], iy = A[k + 1] * lx + A[k + 5] * ly + A[k + 9] * lz + A[k + 13], iz = A[k + 2] * lx + A[k + 6] * ly + A[k + 10] * lz + A[k + 14];
      xs.push(e[0] * ix + e[4] * iy + e[8] * iz + e[12]); ys.push(e[1] * ix + e[5] * iy + e[9] * iz + e[13]); zs.push(e[2] * ix + e[6] * iy + e[10] * iz + e[14]); }
    info.inst = { x: Float32Array.from(xs), y: Float32Array.from(ys), z: Float32Array.from(zs) }; sc *= (m || 1); }
  else info.inst = null;
  info.lx = bs.center.x; info.ly = bs.center.y; info.lz = bs.center.z; info.r = bs.radius; info.rs = bs.radius * sc; info.L = Math.max(.02, L * sc); info.sc = STR.scanId; return info;
}
function str_chain(o) { // 0 = nicht mehr in der Szene · 1 = sichtbar · 2 = verborgen (irgendein Vorfahr unsichtbar)
  let v = 1; for (let p = o; p; p = p.parent) { if (!p.visible) v = 2; if (p === scene) return v; } return 0; }
function str_evalMesh(info, sid) { // Abstand (Kamera/Spieler) und Sichtbarkeitszustand, einmal je Durchgang
  if (info.sw === sid) return; info.sw = sid; const o = info.o; info.st = str_chain(o); if (!info.st) { info.d = 1e9; return; }
  let d = 1e9, dx = 1e9;
  if (info.inst) { const I = info.inst; for (let i = 0; i < I.x.length; i++) { const a = I.x[i] - STR_C.x, b = I.y[i] - STR_C.y, c = I.z[i] - STR_C.z, a2 = I.x[i] - STR_P.x, c2 = I.z[i] - STR_P.z;
      const q = Math.min(a * a + b * b + c * c, a2 * a2 + c2 * c2 + b * b); if (q < d) d = q; const q2 = Math.min(a * a + c * c, a2 * a2 + c2 * c2); if (q2 < dx) dx = q2; } d = Math.sqrt(d) - info.rs; dx = Math.sqrt(dx) - info.rs; }
  else { const e = o.matrixWorld.elements, x = e[0] * info.lx + e[4] * info.ly + e[8] * info.lz + e[12], y = e[1] * info.lx + e[5] * info.ly + e[9] * info.lz + e[13], z = e[2] * info.lx + e[6] * info.ly + e[10] * info.lz + e[14];
    info.park = (info.dyn || info.rs < 4.5) && ((Math.abs(x) < 3.5 && Math.abs(z) < 3.5) || y < -20); // „geparkt“ (Ursprung/unter der Erde, wie RESI_PARK der Basis): wird erst beim Auftritt verschoben
    const a = x - STR_C.x, b = y - STR_C.y, c = z - STR_C.z, a2 = x - STR_P.x, c2 = z - STR_P.z; d = Math.sqrt(Math.min(a * a + b * b + c * c, a2 * a2 + c2 * c2 + b * b)) - info.rs; dx = Math.sqrt(Math.min(a * a + c * c, a2 * a2 + c2 * c2)) - info.rs; }
  info.d = d > 0 ? d : 0; info.dx = dx > 0 ? dx : 0;
}
function str_level(dens, d, s1) { // benötigte Startstufe (reell; ≤ 0 = volle Auflösung) für Texeldichte dens (px/m auf Stufe 0) in Abstand d
  const need = s1 / Math.max(d, .4) * STR.M; const q = dens / need; return q <= 1 ? 0 : Math.log2(q); }
// ---- Registratur: alle KTX-Quellen mit Besitzern (Formen) und Texeldichte (Generator: gibt alle ~300 Formen die Hand zurück)
function* str_scanGen() {
  const t0 = performance.now(); STR.scanId = (STR.scanId || 0) + 1; const meshes = [];
  { const stack = [scene]; let n = 0; while (stack.length) { const o = stack.pop(); const ch = o.children; for (let i = 0; i < ch.length; i++) stack.push(ch[i]);
      if (o.geometry && o.material && !o.isBatchedMesh && o.isMesh) meshes.push(o); if (++n % 5000 === 0 && !STR.syncScan) yield 1; } }
  yield 1; const own = new Map();
  const addTex = (t, m, info) => { if (!(t && t.isCompressedTexture && t.mipmaps && t.mipmaps.length >= 3)) return; const s = t.source; if (!s || !s.__kre) return;
    let rec = STR.recs.get(s);
    if (rec === undefined) { const full = t.mipmaps.slice(); let kcap = full.length; for (let i = 0; i < full.length; i++) if (Math.max(full[i].width, full[i].height) <= STR.KEEPW) { kcap = i; break; }
      if (kcap >= full.length - 1 || kcap === 0) { STR.recs.set(s, null); return; } // keine nutzbare Kette
      rec = { s, texs: [], mats: new Set(), fm: new Set(), full, kcap, cur: 0, want: 0, w0: full[0].width, own: [], dens: [], dg: 0 }; STR.recs.set(s, rec); STR.list.push(rec); }
    if (rec === null) return; if (!rec.texs.includes(t)) rec.texs.push(t); rec.mats.add(m);
    let a = own.get(rec); if (!a) { a = { infos: [], dens: [] }; own.set(rec, a); }
    const rep = t.repeat ? Math.max(Math.abs(t.repeat.x), Math.abs(t.repeat.y), 1e-3) : 1; a.infos.push(info); a.dens.push(rec.w0 * info.u * rep / info.L); };
  for (let i = 0; i < meshes.length; i++) {
    const o = meshes[i]; const mats = Array.isArray(o.material) ? o.material : [o.material]; let info = null;
    for (const m of mats) { if (!m) continue; STR.regM.add(m);
      for (const k in m) { const t = m[k]; if (t && t.isTexture) { if (t.isCompressedTexture) { if (!info) info = str_meshInfo(o); addTex(t, m, info); }
          else if (STR.cv && t.image && t.mapping === THREE.UVMapping && !t.isRenderTargetTexture && !t.isDataTexture && !t.isVideoTexture && !t.isCubeTexture && !t.isDepthTexture && !t.isDataArrayTexture && !t.isData3DTexture && k !== 'envMap') {
            const im = t.image, w = im.width || im.videoWidth || 0, h = im.height || im.videoHeight || 0; if (w * h < 16384) continue; let c = STR.cvs.get(t);
            if (!c) { c = { t, bytes: w * h * 4 * (t.generateMipmaps ? 1.33 : 1), own: [], dens: [], mats: new Set(), idle: 0, seen: -1, w0: w, h0: h, orig: im, lvl: 0, small: null, dg: 0 }; STR.cvs.set(t, c); STR.cvl.push(c); }
            if (c.seen !== STR.scanId) { c.own = []; c.dens = []; c.mats = new Set(); c.seen = STR.scanId; } if (!info) info = str_meshInfo(o); c.own.push(info); c.mats.add(m);
            c.dens.push(c.w0 * info.u * Math.max(Math.abs(t.repeat.x), Math.abs(t.repeat.y), 1e-3) / info.L); } } }
      if (m.uniforms) for (const k in m.uniforms) { const t = m.uniforms[k] && m.uniforms[k].value; if (t && t.isTexture && t.isCompressedTexture) { if (!info) info = str_meshInfo(o); addTex(t, m, info); } } }
    if (STR.geo && o.geometry && o.geometry.attributes.position) { const g = o.geometry; let gr = STR.geos.get(g);
      if (!gr) { let b = 0; for (const k in g.attributes) { const a = g.attributes[k]; if (a.array) b += a.array.byteLength; } if (g.index) b += g.index.array.byteLength;
        for (const k in g.morphAttributes) for (const a of g.morphAttributes[k]) if (a.array) b += a.array.byteLength * 2.7; // Morph-Ziele liegen als RGBA32F-Textur (Lage + Normale je Ziel)
        gr = { g, bytes: b, own: [], idle: 0, fresh: true }; if (!STR.suG.has(g)) STR.suG.set(g, 0.5); STR.geos.set(g, gr); STR.glist.push(gr); }
      if (gr.fresh || gr.seenScan !== STR.scanId) { gr.own = []; gr.seenScan = STR.scanId; gr.fresh = false; } if (!info) info = str_meshInfo(o); gr.own.push(info); }
    if (i % 300 === 299) yield 1;
  }
  const seen = new Set(); for (const [rec, a] of own) { rec.own = a.infos; rec.dens = a.dens; seen.add(rec); }
  for (const rec of STR.list) if (!seen.has(rec)) { rec.own = []; rec.dens = []; }
  STR.scanMs = Math.round(performance.now() - t0); STR.lastScan = performance.now(); STR.nScan = (STR.nScan || 0) + 1;
}
// ---- Benötigte Stufe je Textur (ein Durchgang, in Scheiben)
function* str_wantGen() {
  const H = renderer.domElement.height || 861, fov = camera.fov || 60, s1 = H / (2 * Math.tan(fov * Math.PI / 360)); STR_P.copy(player.pos); STR_C.copy(camera.position);
  STR.s1 = s1; const sid = ++STR.sweepId, now = STR.now; let i = 0; const list = STR.list.slice();
  for (const rec of list) {
    let w = rec.kcap + 1, vn = false; const I = rec.own, D = rec.dens;
    for (let j = 0; j < I.length; j++) { const info = I[j]; str_evalMesh(info, sid); const st = info.st; if (!st || info.park) continue; let d = info.d;
      if (st === 1 && d < STR.RG) vn = true;
      if (st === 2) { if (d > (info.dyn ? STR.RGS : STR.RH)) continue; d = Math.max(0, d - STR.HO); } const l = str_level(D[j], d, s1); if (l < w) { w = l; if (w <= 0) break; } }
    if (rec.fm.size && w > 0) for (const m of rec.fm) if (STR.suM.get(m) > now - 25000) { w = 0; break; }
    // Totband (kein Hin und Her an der Stufengrenze): hochstufen erst, wenn die Anforderung > 0,2 Stufen über dem Fenster liegt; herabstufen erst bei ≥ 1,25 Stufen Luft
    let want = Math.max(0, Math.min(rec.kcap, Math.floor(w))); const c = rec.cur;
    if (!STR.noBand) { if (want < c && w >= c - .2) want = c; else if (want > c && w < c + 1.25) want = c; }
    rec.want = want; rec.vn = vn; if (++i % 140 === 0) yield 1;
  }
}
// ---- Formen (Geometrie): benötigt, wenn ein Besitzer sichtbar und < RG m entfernt ist (verborgen: < RGH m). Nicht benötigt seit geoIdle ms → von der Grafikkarte nehmen (die Daten bleiben im
// Hauptspeicher; three.js lädt beim Wiederbrauchen hoch). Vorab hochladen per Stellvertreter-Form in einem winzigen Puffer (ein Zeichenaufruf, keine Fragmentarbeit).
const str_geoRes = gr => { const g = gr.g, l = Math.max(STR.suG.get(g) || 0, STR.shG.get(g) || 0); return l > 0 && !(STR.sdG.get(g) >= l); }; // auf der Grafikkarte, wenn seit dem letzten Verwerfen gezeichnet
function* str_geoWantGen(sid) {
  let i = 0; const now = performance.now();
  for (const gr of STR.glist) { let need = false; const O = gr.own;
    for (let j = 0; j < O.length; j++) { const info = O[j]; str_evalMesh(info, sid); const st = info.st; if (!st) continue; if (info.park) continue; if (st === 1 ? info.d < STR.RG : info.dx < (info.dyn ? STR.RGS : STR.RGH)) { need = true; break; } }
    if (!need && STR.suG.get(gr.g) > now - 6000) need = true; // gerade gezeichnet (Fremdszenen, Schatten)
    gr.need = need; if (need) gr.idle = 0; else if (!gr.idle) gr.idle = now;
    if (++i % 200 === 0) yield 1; }
}
function str_geoUp(gr) {
  const sc = STR.pxScene || (STR.pxScene = new THREE.Scene()); if (!STR.pxMesh) { STR.pxMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false }); STR.pxMesh = new THREE.Mesh(gr.g, STR.pxMat); STR.pxMesh.frustumCulled = false; STR.pxMesh.matrixAutoUpdate = false; sc.add(STR.pxMesh); STR.pxCam = new THREE.PerspectiveCamera(); STR.pxRT = new THREE.WebGLRenderTarget(2, 2); }
  STR.pxMesh.geometry = gr.g; if (gr.g.morphAttributes.position || gr.g.morphAttributes.normal) { try { STR.pxMesh.updateMorphTargets(); } catch (e) {} } else STR.pxMesh.morphTargetInfluences = undefined; const rt0 = renderer.getRenderTarget(); renderer.setRenderTarget(STR.pxRT);
  try { renderer.render(sc, STR.pxCam); } catch (e) {} finally { renderer.setRenderTarget(rt0); } STR.nGeoUp++; }
// ---- Canvas-/Bild-Texturen: Abstand wie bei Formen; Verwerfen = dispose (die Pixel bleiben im Canvas), Vorladen = initTexture
function* str_cvGen(sid) {
  const now = performance.now(), R = renderer.properties; let i = 0, k = 0;
  for (const c of STR.cvl) { const t = c.t; let need = false; const O = c.own;
    let want = 2; // Auflösungsstufe (0 Original, 1 halbe, 2 Viertel Kantenlänge) – nur für große Rohbilder (> 512 px)
    for (let j = 0; j < O.length; j++) { const info = O[j]; str_evalMesh(info, sid); const st = info.st; if (!st || info.park) continue; if (st === 1 ? info.d < STR.RG : info.dx < STR.RGH) { need = true;
        const d = st === 1 ? info.d : Math.max(0, info.dx - STR.HO); const l = Math.floor(str_level(c.dens[j], d, STR.s1)); if (l < want) want = l; if (want === 0) break; } }
    if (!need) for (const m of c.mats) if (STR.suM.get(m) > now - 8000) { need = true; want = 0; break; }
    if (c.w0 <= 512 || c.dens.length === 0) want = 0; else if (c.w0 >> want < 256) want = Math.max(0, Math.floor(Math.log2(c.w0 / 256)));
    const P0 = R.get(t), res0 = !!(P0 && P0.__webglTexture);
    if (need && want !== c.lvl && (!res0 || want < c.lvl || (c.dg || (c.dg = now)) && now - c.dg > 4000)) { str_cvSet(c, want); c.dg = 0; k++; } else if (want === c.lvl) c.dg = 0;
    if (need) c.idle = 0; else if (!c.idle) c.idle = now;
    const P = R.get(t), res = !!(P && P.__webglTexture);
    if (need && !res && t.version > 0 && k < 2) { const t0 = performance.now(); try { renderer.initTexture(t); } catch (e) {} STR.nCvUp++; k++; const ms = performance.now() - t0; if (ms > STR.hitchMs) STR.hitchMs = ms; }
    else if (!need && res && c.idle && now - c.idle > 6000 && c.bytes > 100000) { try { t.dispose(); } catch (e) {} STR.nCvEv++; STR.cvEvMB += c.bytes / 1048576; }
    if (++i % 150 === 0) yield 1; }
}
function str_cvSet(c, lvl) { // Rohbild in kleinerer Fassung (Canvas) auf die Grafikkarte; Original bleibt im Speicher
  const t = c.t; let im = c.orig;
  if (lvl > 0) { if (!c.small) c.small = []; let cv = c.small[lvl]; if (!cv) { cv = document.createElement('canvas'); cv.width = Math.max(4, c.w0 >> lvl); cv.height = Math.max(4, c.h0 >> lvl); const x = cv.getContext('2d'); x.drawImage(c.orig, 0, 0, cv.width, cv.height); c.small[lvl] = cv; } im = cv; }
  try { t.dispose(); t.image = im; } catch (e) { return; } c.lvl = lvl; STR.nCvLv = (STR.nCvLv || 0) + 1; }
// ---- Fenster setzen
function str_apply(rec, k) {
  const s = rec.s, win = rec.full.slice(k); for (let i = k; i < rec.kcap; i++) if (!rec.full[i].data) return false; // nur mit vorhandenen Daten (Fenster oberhalb der Kopie ≤ KEEPW)
  for (const t of rec.texs) { try { t.dispose(); } catch (e) {} t.mipmaps = win; }
  const im = s.data; if (im && typeof im === 'object' && !(im instanceof HTMLElement)) { im.width = win[0].width; im.height = win[0].height; }
  rec.cur = k; s.__ktail = k >= rec.kcap; if (s.__ktail) s.__kfree = false; else s.__kpin = true; // hochgeladen wird gleich (str_up), bis dahin Daten nicht freigeben
  return true;
}
function str_up(rec) { // Fenster sofort auf die Grafikkarte (sonst täte es three.js synchron beim ersten Zeichnen)
  const t0 = performance.now(); const ks = new Set();
  for (const t of rec.texs) { const k = t.wrapS + ',' + t.wrapT + ',' + t.magFilter + ',' + t.minFilter + ',' + t.anisotropy + ',' + t.colorSpace + ',' + t.flipY + ',' + t.format; if (ks.has(k)) continue; ks.add(k); try { renderer.initTexture(t); } catch (e) {} }
  rec.s.__kpin = false; const ms = performance.now() - t0; STR.nUpload++; if (ms > STR.hitchMs) STR.hitchMs = ms; return ms; }
function str_restore(rec) { const s = rec.s; if (s.__kbusy || KTXF.busy >= STR.maxBusy) return false; STR.nRestore++; ktxRestore(s); return true; }
// ---- Hauptschleife: ein Coroutine-Generator; Rückgabe 1 = Zeitscheibe zu Ende (gleich wieder aufrufen), 0 = wartet
function* str_co() {
  for (;;) {
    while (!STR.ready || STR.idle || state.paused || performance.now() - (STR.lastSweep || 0) < (STR.burst || KTXF.busy > 0 || STR.rq.length ? 120 : 500)) yield 0;
    STR.lastSweep = performance.now(); const P = player.pos;
    if (STR.lastP && (Math.abs(P.x - STR.lastP.x) > 25 || Math.abs(P.z - STR.lastP.z) > 25)) STR.burst = 6; if (!STR.lastP) STR.lastP = new THREE.Vector3(); STR.lastP.copy(P);
    const t1 = performance.now(); yield* str_wantGen(); STR.sweepMs = +(performance.now() - t1).toFixed(1);
    const up = [], down = []; for (const rec of STR.list) { if (rec.want < rec.cur) up.push(rec); else if (rec.want > rec.cur) down.push(rec); else rec.dg = 0; }
    up.sort((a, b) => a.want - b.want); const now = performance.now(); STR.nUpWait = 0;
    for (const rec of up) { const s = rec.s; let have = true; for (let i = rec.want; i < rec.kcap; i++) { const m = rec.full[i]; if (!m || !m.data) { have = false; break; } }
      if (!have) { STR.nUpWait++; if (!s.__kbusy && !rec.rq) { rec.rq = true; STR.rq.push(rec); } continue; }
      if (str_apply(rec, rec.want)) { STR.nUp++; str_up(rec); yield 1; } }
    for (const rec of down) { if (!rec.dg) { rec.dg = now; continue; } if (now - rec.dg < 4000) continue; // Herabstufen erst nach 4 s Ruhe (kein Hin und Her)
      if (str_apply(rec, rec.want)) { STR.nDown++; rec.dg = 0; str_up(rec); yield 1; } } // fehlen die Daten der Zwischenstufe: Stufe bleibt, bis Entfernung die Kopie (≤ KEEPW) erlaubt
    if (STR.geo) { yield* str_geoWantGen(STR.sweepId); const tn = performance.now(); let k = 0;
      for (const gr of STR.glist) { const res = str_geoRes(gr);
        if (gr.need && !res) { str_geoUp(gr); if (++k % 3 === 0) yield 1; }
        else if (!gr.need && res && gr.idle && tn - gr.idle > STR.geoIdle && gr.bytes > 12000) { try { gr.g.dispose(); } catch (e) {} STR.sdG.set(gr.g, tn); STR.nGeoEv++; STR.geoEvMB += gr.bytes / 1048576; } } }
    if (STR.cv) yield* str_cvGen(STR.sweepId);
    if (STR.burst > 0) STR.burst--;
    if (performance.now() - STR.lastScan > 12000) yield* str_scanGen(); // neue Besitzer (Module hängen später Formen ein)
  }
}
function stream_stats() { // Zahl und geschätzter Grafikspeicher nach Fenster
  const hist = {}; let mb = 0, full = 0, blurry = 0; const now = performance.now();
  for (const rec of STR.list) { const win = rec.full.slice(rec.cur); let b = 0; for (const m of win) b += m.data ? (m.data.byteLength || 0) : Math.max(m.width, 4) * Math.max(m.height, 4); mb += b;
    let ball = 0; for (const m of rec.full) ball += Math.max(m.width, 4) * Math.max(m.height, 4); full += ball; hist[rec.cur] = (hist[rec.cur] || 0) + 1; if (rec.want < rec.cur) blurry++; }
  return { recs: STR.list.length, hist, resMB: Math.round(mb / 1048576), fullMB: Math.round(full / 1048576), blurry, up: STR.nUp, down: STR.nDown, restores: STR.nRestore, uploads: STR.nUpload, hitchMs: Math.round(STR.hitchMs), geos: STR.glist.length, geoRes: STR.glist.filter(g => str_geoRes(g)).length, geoResMB: Math.round(STR.glist.filter(g => str_geoRes(g)).reduce((a, g) => a + g.bytes, 0) / 1048576), geoEv: STR.nGeoEv, geoEvMB: Math.round(STR.geoEvMB), geoUp: STR.nGeoUp, cv: STR.cvl.length, cvEv: STR.nCvEv, cvEvMB: Math.round(STR.cvEvMB), cvUp: STR.nCvUp, cvLv: STR.nCvLv, cvSmall: STR.cvl.filter(c => c.lvl > 0).length, skinDup: STR.skinDup, skinDupMB: STR.skinDupMB, sweepMs: +STR.sweepMs.toFixed(1), scanMs: Math.round(STR.scanMs), err: STR.err }; }
// ---- Laden: Registratur aufbauen, Fenster für die Startposition setzen (die Basis lädt danach nur Fenster hoch) – Aufruf aus der Basis (stream_patch.py), nach texDedupe
// ---- Gleiche Skelett-/Morph-Formen zusammenlegen: Figuren-Klone (lwo_*, k5_*, Nachbilder, Kino-Sätze) haben je eine eigene, inhaltsgleiche Form – gemessen 621 Formen, davon
// nur 248 verschieden; jede mit Morph-Zielen kostet auf der Grafikkarte eine eigene Textur (Lage + Normale × Ziele × 16 B). Gleicher Inhalt (alle Puffer, Index, Gruppen, Zeichenbereich,
// userData, Morph-Ziele) → eine gemeinsame Form. Zusammengelegt wird vor dem Hochladen.
function str_skinDedup() {
  const H = a => { let h = 2166136261 | 0; if (!(a.byteOffset & 3) && !(a.byteLength & 3)) { const u = new Uint32Array(a.buffer, a.byteOffset, a.byteLength >> 2); for (let i = 0; i < u.length; i += 5) h = Math.imul(h ^ u[i], 16777619); } else for (let i = 0; i < a.length; i += 5) h = Math.imul(h ^ a[i], 16777619); return (h >>> 0).toString(36) + ':' + a.length; };
  const same = (A, B) => { if (A.length !== B.length) return false; for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false; return true; };
  const arrs = g => { const o = []; for (const k of Object.keys(g.attributes).sort()) { const a = g.attributes[k]; if (!a.array || a.isInterleavedBufferAttribute) return null; o.push(a.array); }
    for (const k of Object.keys(g.morphAttributes).sort()) for (const a of g.morphAttributes[k]) { if (!a.array || a.isInterleavedBufferAttribute) return null; o.push(a.array); } if (g.index) o.push(g.index.array); return o; };
  const owners = new Map(); scene.traverse(o => { const g = o.geometry; if (g && o.isMesh && !o.isInstancedMesh && !o.isBatchedMesh && (o.isSkinnedMesh || (g.morphAttributes && (g.morphAttributes.position || g.morphAttributes.normal)))) { if (!owners.has(g)) owners.set(g, []); owners.get(g).push(o); } });
  const keep = new Map(); let n = 0, mb = 0;
  for (const [g, objs] of owners) { const A = arrs(g); if (!A) continue; let key = Object.keys(g.attributes).sort().join(',') + '|' + A.map(H).join('/') + '|' + JSON.stringify(g.groups) + g.drawRange.start + ':' + g.drawRange.count + (g.morphTargetsRelative ? 'r' : '') + JSON.stringify(g.userData || {});
    const c = keep.get(key); if (!c) { keep.set(key, { g, A }); continue; } if (c.g === g) continue;
    let ok = A.length === c.A.length; for (let i = 0; ok && i < A.length; i++) if (A[i].constructor !== c.A[i].constructor || !same(A[i], c.A[i])) ok = false;
    for (const k in g.attributes) if (ok && (g.attributes[k].itemSize !== c.g.attributes[k].itemSize || g.attributes[k].normalized !== c.g.attributes[k].normalized)) ok = false;
    if (!ok) continue; let b = 0; for (const a of A) b += a.byteLength; for (const o of objs) o.geometry = c.g; try { g.dispose(); } catch (e) {} n++; mb += b / 1048576; }
  STR.skinDup = n; STR.skinDupMB = Math.round(mb);
}
function stream_load() {
  if (STR.off || typeof KTXF === 'undefined' || !KTXF.on) return; const t0 = performance.now();
  if (!/[?&]noskindedup/.test(location.search)) { try { str_skinDedup(); } catch (e) { console.warn('Stream: Skelettformen', e); } }
  scene.updateMatrixWorld(true); STR.syncScan = true; { const g = str_scanGen(); while (!g.next().done); } STR.syncScan = false; STR.noBand = true; { const g = str_wantGen(); while (!g.next().done); } STR.noBand = false;
  let freed = 0, n = 0; for (const rec of STR.list) { const k = Math.min(rec.want, rec.kcap); if (k > 0) { for (let i = 0; i < k; i++) { const m = rec.full[i]; if (m && m.data) { freed += m.data.byteLength; m.data = null; } }
      const win = rec.full.slice(k); for (const t of rec.texs) t.mipmaps = win; const im = rec.s.data; if (im && typeof im === 'object' && !(im instanceof HTMLElement)) { im.width = win[0].width; im.height = win[0].height; }
      rec.cur = k; rec.s.__ktail = k >= rec.kcap; rec.s.__kfree = false; n++; } }
  // Rohbilder/Canvas: nur Nahes und Sichtbares beim Laden hochladen, große Bilder gleich in der Stufe für die Startposition
  if (STR.cv) { const sid = ++STR.sweepId, s1 = STR.s1 || 1000;
    for (const c of STR.cvl) { let need = false, want = 2; for (let j = 0; j < c.own.length; j++) { const info = c.own[j]; str_evalMesh(info, sid); const st = info.st; if (!st || info.park) continue;
        if (st === 1 ? info.d < STR.RG : info.dx < STR.RGH) { need = true; const d = st === 1 ? info.d : Math.max(0, info.dx - STR.HO), l = Math.floor(str_level(c.dens[j], d, s1)); if (l < want) want = l; if (want === 0) break; } }
      c.needLoad = need; if (!need) continue; if (c.w0 <= 512 || !c.dens.length) want = 0; else if (c.w0 >> want < 256) want = Math.max(0, Math.floor(Math.log2(c.w0 / 256))); if (want > 0) str_cvSet(c, want); } }
  STR.loadFreedMB = Math.round(freed / 1048576); STR.loadN = n; STR.loadMs = Math.round(performance.now() - t0);
  // Zeichnen vermerken (Material → Zeitstempel; nicht eingetragene Materialien = Fremdszenen wie Aufheben-3D/Kino → volle Auflösung, solange sie gezeichnet werden)
  const rbd = renderer.renderBufferDirect; if (!/[?&]nostamp/.test(location.search))
  renderer.renderBufferDirect = function (a, b, geo, mat, obj, grp) { if (!mat.isMeshDepthMaterial && !mat.isMeshDistanceMaterial) { const t = STR.now; STR.suM.set(mat, t); STR.suG.set(geo, t); if (!STR.regM.has(mat)) { STR.regM.add(mat); STR.unreg.push(mat); } } else STR.shG.set(geo, STR.now); return rbd.call(this, a, b, geo, mat, obj, grp); }; // Schattenpässe zählen nicht als „gezeichnet“ (geparkte Figuren liegen im Schattenbild)
  STR.ready = true; STR.t0 = performance.now(); STR.now = STR.t0;
}
// Früh-Übersetzen: Auswahl schon während des Modulbaus (vor der Registratur): Abstand der Hülle zur Startposition
function stream_earlySel(o) {
  if (STR.off || !STR.cs || typeof LITE !== 'undefined' && LITE) return true; if (STR.ready) return stream_compileSel(o);
  const g = o.geometry; if (!g || o.isSkinnedMesh || o.isInstancedMesh || !g.attributes || !g.attributes.position) return true;
  try { if (!g.boundingSphere) g.computeBoundingSphere(); o.updateWorldMatrix(true, false); const e = o.matrixWorld.elements, c = g.boundingSphere.center, r = g.boundingSphere.radius;
    const x = e[0] * c.x + e[4] * c.y + e[8] * c.z + e[12], z = e[2] * c.x + e[6] * c.y + e[10] * c.z + e[14], sc = Math.sqrt(Math.max(e[0] * e[0] + e[1] * e[1] + e[2] * e[2], e[8] * e[8] + e[9] * e[9] + e[10] * e[10])) || 1;
    const d = Math.hypot(x - player.pos.x, z - player.pos.z) - r * sc; let vis = true; for (let p = o; p; p = p.parent) if (!p.visible) { vis = false; break; }
    return d < (vis ? STR.RC : STR.RCH); } catch (e) { return true; } }
// Materialien der Nachbearbeitung (Composer-Pässe samt Bloom-Stufen) als Mini-Szene parallel übersetzen (Aufruf aus stream_patch.py im Gesamtdurchgang)
function stream_passCompile() {
  try { if (STR.off || typeof composer === 'undefined' || /[?&]nopasscomp/.test(location.search)) return null; const mats = new Set();
    const take = v => { if (!v) return; if (Array.isArray(v)) { v.forEach(take); return; } if (v.isMaterial) mats.add(v); };
    for (const p of composer.passes) { for (const k of Object.keys(p)) { const v = p[k]; if (v && (v.isMaterial || Array.isArray(v))) take(v); } if (p.fsQuad && p.fsQuad.material) mats.add(p.fsQuad.material); if (p.fsQuad && p.fsQuad._mesh && p.fsQuad._mesh.material) mats.add(p.fsQuad._mesh.material); }
    if (!mats.size) return null; const sc = new THREE.Scene(), g = new THREE.PlaneGeometry(2, 2); for (const m of mats) { const q = new THREE.Mesh(g, m); q.frustumCulled = false; sc.add(q); }
    return renderer.compileAsync(sc, new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)); } catch (e) { console.warn('Stream: Pässe', e); return null; } }
// Verborgene oberste Gruppe ohne Licht: beim Laden verborgen lassen (stream_patch.py)
function stream_keepHidden(o) { if (STR.off || !STR.ready || o.visible !== false) return false; let L = false; o.traverse(x => { if (x.isLight) L = true; }); return !L; }
// Übersetzungs-Auswahl für den Gesamtdurchgang beim Laden (stream_patch.py): true = jetzt übersetzen
function stream_compileSel(o) {
  if (STR.off || !STR.ready || !STR.cs) return true; const i = STR.infoMap.get(o); if (!i || i.sc !== STR.scanId || !i.st || i.park) return true; // ohne Registratur oder geparkt (Figuren-Vorlagen) immer
  return i.st === 1 ? i.d < STR.RC : i.dx < STR.RCH; }
function stream_compileRoot() { if (STR.off || !STR.ready || !STR.cs) return null; return { traverse(cb) { scene.traverse(o => { if (o.material && stream_compileSel(o)) cb(o); }); }, traverseVisible() {} }; }
// Beim Laden nur hochladen, was Nahes/Sichtbares braucht (stream_patch.py: „Texturen vorab“/„Texturen hochladen“); der Rest folgt beim ersten Zeichnen bzw. über das Streaming
function stream_texNeeded(t) {
  if (STR.off || !STR.ready) return true;
  if (t.isCompressedTexture) { const r = STR.recs.get(t.source); return !r || r.cur < r.kcap || r.vn; }
  const c = STR.cvs.get(t); return !c || c.needLoad !== false; }
// Hochlade-Durchgang der Basis (stream_patch.py): verborgene Formen bleiben verborgen – ihre Formen/Fenster kommen beim ersten Sichtbarwerden bzw. über das Streaming
function stream_skipUpload(o) { if (STR.off || !STR.ready || o.isLight) return false; if (o.visible === false) return true;
  if (STR.geo && o.isMesh && o.geometry && STR.geos.has(o.geometry)) { const info = str_meshInfo(o); STR_P.copy(player.pos); STR_C.copy(camera.position); str_evalMesh(info, ++STR.sweepId);
    if (info.st === 1 && info.d > STR.RG && !info.park) { o.visible = false; return true; } }
  return false; }
// Wiederherstellungs-Pumpe (alle 33 ms): so viele wie erlaubt gleichzeitig starten, nächste sofort nach Abschluss (nicht erst im nächsten Durchgang)
function str_pump() { const q = STR.rq; let n = 0; while (q.length && KTXF.busy < STR.maxBusy && n < 6) { const rec = q.shift(); rec.rq = false; if (rec.want >= rec.cur || rec.s.__kbusy) continue; if (str_restore(rec)) n++; } }
// Fremde Materialien (nicht in der Szene registriert, zeichnen aber Texturen unserer Quellen) – bei jedem Durchgang nachtragen
function str_foreign() {
  while (STR.unreg.length) { const m = STR.unreg.pop(); if (m.isMeshDepthMaterial || m.isMeshDistanceMaterial) continue;
    for (const k in m) { const t = m[k]; if (t && t.isTexture && t.isCompressedTexture && t.source && STR.recs.get(t.source)) { const rec = STR.recs.get(t.source); rec.fm.add(m); if (!rec.texs.includes(t)) rec.texs.push(t); } } }
}
if (!STR.off) { let co = null;
  setInterval(() => { try { if (!STR.ready) return; STR.now = performance.now(); str_foreign(); str_pump(); if (!co) co = str_co(); const t0 = performance.now();
      while (performance.now() - t0 < 1.2) { const r = co.next(); if (r.done) { co = null; break; } if (r.value === 0) break; } STR.ms = +(performance.now() - t0).toFixed(1); }
    catch (e) { co = null; if (!STR.err) { STR.err = String(e); console.warn('Stream', e); } } }, 33);
}

// GLB-Bild (KTX2) direkt aus der bufferView an den KTX2-Lader (stream_patch.py: loadImageSource der Basis). Das Original kopiert jedes Bild in einen Blob, erzeugt eine Objekt-URL und lässt sie
// per fetch wieder einlesen. Ergebnis ist dasselbe CompressedTexture; Zwischenspeicher (sourceCache) und Nutzerdaten (extras, mimeType) wie im Original.
function ktx_fast(p, si, loader) {
  try { if (typeof KTX === 'undefined' || !KTX.loader || loader !== KTX.loader || /[?&]noktxfast/.test(location.search)) return null;
    const def = p.json.images && p.json.images[si]; if (!def || def.bufferView === undefined || def.uri) return null; if (p.sourceCache[si] !== undefined) return null;
    const prom = p.getDependency('bufferView', def.bufferView).then(buf => new Promise((res, rej) => loader.parse(buf, res, rej))).then(t => {
      if (def.extras && typeof def.extras === 'object') Object.assign(t.userData, def.extras); t.userData.mimeType = def.mimeType || 'image/ktx2'; return t; });
    p.sourceCache[si] = prom; return prom; } catch (e) { return null; } }
// Schutz (15.10.): Hochladen ohne CPU-Daten. Eine Quelle ist schon hochgeladen und freigegeben (ktxSweep), eine NEUE Textur mit gleicher Quelle, aber anderer Sampler-Kombination
// (Wiederholung/Anisotropie) wird zum ersten Mal gezeichnet -> three.js ruft compressedTexSubImage2D mit data = null auf (TypeError, Textur bleibt schwarz, weil die Version als hochgeladen gilt).
// Jetzt: Aufruf ohne Daten wird uebersprungen (kein Throw), die Quelle wiederhergestellt und angeheftet, danach Neu-Upload (needsUpdate).
STR.fixQ = []; STR.nFix = 0; STR.fixTry = new Map();
function str_fixNoData(gl) {
  const h = gl.getParameter(gl.TEXTURE_BINDING_2D), R = renderer.properties; if (!h) return; let t = null;
  for (const rec of STR.list) { for (const x of rec.texs) { const p = R.get(x); if (p && p.__webglTexture === h) { t = x; break; } } if (t) break; }
  if (!t) scene.traverse(o => { if (t || !o.material) return; for (const m of Array.isArray(o.material) ? o.material : [o.material]) for (const k in m) { const x = m[k]; if (x && x.isCompressedTexture) { const p = R.get(x); if (p && p.__webglTexture === h) { t = x; return; } } } });
  if (!t || STR.fixQ.includes(t)) return; const s = t.source; s.__kpin = true; STR.fixQ.push(t); STR.nFix++; if (!s.__kbusy && s.__kre) ktxRestore(s);
}
{ const P = WebGL2RenderingContext.prototype, o = P.compressedTexSubImage2D;
  P.compressedTexSubImage2D = function (a0, a1, a2, a3, a4, a5, a6, a7, ...r) {
    if (typeof a7 === 'number' || ArrayBuffer.isView(a7)) return o.call(this, a0, a1, a2, a3, a4, a5, a6, a7, ...r);
    try { str_fixNoData(this); } catch (e) {} };
  setInterval(() => { try { const q = STR.fixQ; for (let i = q.length - 1; i >= 0; i--) { const t = q[i], s = t.source; if (s.__kbusy) continue;
      if (t.mipmaps.every(m => m && m.data)) { t.needsUpdate = true; s.__kpin = false; q.splice(i, 1); STR.fixTry.delete(t); }
      else { const n = (STR.fixTry.get(t) || 0) + 1; STR.fixTry.set(t, n); if (n > 12 || !s.__kre) { s.__kpin = false; q.splice(i, 1); STR.fixTry.delete(t); } else ktxRestore(s); } } } catch (e) {} }, 100); }
window.__stream = STR; window.__streamStats = stream_stats;
