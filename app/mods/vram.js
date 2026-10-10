// =====================================================================  VRAM-DIÄT (Modul „vram“, 10.10.2026, Leistungs-Block)
// Gemessen (Normalbetrieb, Kreuzung): GPU-Prozess 7,1 GB dediziert; 2 134 KTX-Texturen ≈ 5,2 GB (davon 393 × 2048² tiling + 221 × 2048² mit Texeldichte > 6 000 px/m).
// Die obersten Mip-Stufen sind dort nie sichtbar: ein Kleinteil (0,3 m) mit 2048²-Textur hat 6 800 Texel/m, der Bildschirm löst bei 1 m Abstand ~880 px/m auf.
// Hier wird je KTX-Quelle die NIEDRIGSTE Texeldichte über alle Besitzer-Formen bestimmt (Texturbreite × UV-Spannweite × Wiederholung / größte Weltausdehnung der Form; bei
// Instanzen mit der größten Instanz-Skalierung) und die oberste(n) Mip-Stufe(n) entfernt, solange danach auch der am dünnsten belegte Besitzer noch ≥ 1 500 px/m hat
// (höchstens 2 Stufen, mindestens 256 px). Figuren (Skelett): Grenze doppelt so hoch (Nahaufnahmen im Kino). ?vram=lean: Grenze 700 px/m (Sparmodus für parallele GPU-Last).
// Nicht angefasst: Batches, ShaderMaterial-Uniforms, Texturen, die schon auf der Grafikkarte liegen, Canvas-Texturen (werden zur Laufzeit neu gezeichnet).
// Läuft ganz zuletzt (nach leistung) und vor „Grafik vorbereiten“ – die Texturen sind dann noch nicht hochgeladen. Die CPU-Daten der entfernten Stufen werden sofort freigegeben.
// Wiederherstellen (ktxRestore der Basis) schreibt in dieselben Mip-Objekte – die Zählung stimmt, weil nur das Feld mipmaps der Textur gekürzt wird, nicht s.__kmips.
// Aus: ?novram    Zahlen: window.__vram
const VRAM = { off: /[?&]novram/.test(location.search), dedupN: 0, dedupMB: 0, dedupMs: 0, passes: 0, cut: 0, ntex: 0, savedMB: 0, hist: {}, T: /[?&]vram=lean/.test(location.search) ? 700 : 1500, ms: 0 };

// ---- Geometrie-Dedup: gemessen 5 715 Geometrien mit exakt gleichem Inhalt (≈ 1,0 GB; davon InstancedMesh-Gruppen gleicher Pflanzen/Steine/Kleinteile mit je eigenem geometry.clone() ≈ 0,8 GB JS-Heap;
// die Grafikkarte hält sie nur, wenn sie schon gezeichnet wurden). Gleicher Inhalt (alle Attribute, Index, Gruppen, Zeichenbereich) → eine gemeinsame Geometrie. Ausgenommen: Skelett-Formen, Morph-Ziele,
// Batches, Instanz-Attribute, verschachtelte Puffer, dynamische Puffer (zur Laufzeit beschrieben).
function vram_geoSig(g) {
  if (!g.attributes || !g.attributes.position || !g.attributes.position.array || g.isInstancedBufferGeometry) return null;
  if (g.morphAttributes && Object.keys(g.morphAttributes).length) return null; if (g.userData && Object.keys(g.userData).length) return null;
  let sig = ''; const names = Object.keys(g.attributes).sort();
  for (const n of names) { const a = g.attributes[n]; if (!a.array || a.isInterleavedBufferAttribute || a.isInstancedBufferAttribute || a.usage !== 35044) return null; sig += n + ':' + a.itemSize + ':' + a.count + ':' + (a.normalized ? 1 : 0) + ':' + a.array.constructor.name + ';'; }
  if (g.index) sig += 'i' + g.index.count + ':' + g.index.array.constructor.name; sig += 'g' + JSON.stringify(g.groups) + 'd' + g.drawRange.start + ':' + g.drawRange.count;
  return sig; }
function vram_hash(a) { let h = 2166136261 | 0; const n = a.byteLength >> 2; if (!(a.byteOffset & 3) && !(a.byteLength & 3)) { const u = new Uint32Array(a.buffer, a.byteOffset, n); for (let i = 0; i < n; i++) h = Math.imul(h ^ u[i], 16777619); }
  else { const u = new Uint8Array(a.buffer, a.byteOffset, a.byteLength); for (let i = 0; i < u.length; i++) h = Math.imul(h ^ u[i], 16777619); } return h >>> 0; }
function vram_gleich(a, b) { if (a.byteLength !== b.byteLength) return false; if (a.constructor !== b.constructor) return false; for (let i = 0, n = a.length; i < n; i++) if (a[i] !== b[i]) return false; return true; }
const VRAM_KEEP = new Map();
function* vram_dedupGen() { // inkrementell (≈ 3 ms je Zeitscheibe), mit gemeinsamem Merkzettel VRAM_KEEP über mehrere Durchgänge
  const t0 = performance.now(); let ersetzt = 0, mb = 0, last = performance.now(); const owner = new Map();
  // Nur Geometrien, die ausschließlich von InstancedMesh benutzt werden: Instanz-Prototypen sind statisch. Normale Meshes (Flammen, Stoff, Dampf …) schreiben ihre Puffer zur Laufzeit
  // um (needsUpdate), ohne die Nutzungsart zu ändern – ihre gleichen Anfangswerte dürfen nicht zusammenfallen.
  const dyn = new Set();
  scene.traverse(o => { const g = o.geometry; if (!g || o.isSkinnedMesh || o.isBatchedMesh || o.isLine || o.isPoints) return; if (!o.isInstancedMesh) { dyn.add(g); return; } if (!owner.has(g)) owner.set(g, []); owner.get(g).push(o); });
  for (const g of dyn) owner.delete(g);
  yield;
  for (const [g, objs] of owner) { if (performance.now() - last > 3) { yield; last = performance.now(); } if (g.__vdup || g.__vkeep) continue;
    const sig = vram_geoSig(g); if (!sig) continue; let h = vram_hash(g.attributes.position.array); if (g.index) h = (h ^ vram_hash(g.index.array)) >>> 0; const key = sig + '#' + h;
    const c = VRAM_KEEP.get(key); if (!c) { VRAM_KEEP.set(key, g); g.__vkeep = true; continue; }
    if (c === g) continue; let ok = true; for (const n of Object.keys(g.attributes)) { if (!vram_gleich(g.attributes[n].array, c.attributes[n].array)) { ok = false; break; } } if (ok && g.index && !vram_gleich(g.index.array, c.index.array)) ok = false;
    if (!ok) continue;
    let b = 0; for (const n in g.attributes) b += g.attributes[n].array.byteLength; if (g.index) b += g.index.array.byteLength;
    for (const o of objs) o.geometry = c; try { g.dispose(); } catch (e) {} g.__vdup = true; ersetzt++; mb += b / 1048576; }
  VRAM.dedupN += ersetzt; VRAM.dedupMB += Math.round(mb); VRAM.dedupMs += Math.round(performance.now() - t0); VRAM.passes++;
}
function vram_dedupSync() { const it = vram_dedupGen(); while (!it.next().done); }
function vram_dedupLauf() { // Durchgang über mehrere Bilder verteilt
  if (VRAM.lauf) return; const it = vram_dedupGen(); VRAM.lauf = true; const f = () => { let r; try { r = it.next(); } catch (e) { VRAM.lauf = false; console.warn('VRAM-Dedup', e); return; } if (r.done) { VRAM.lauf = false; return; } requestAnimationFrame(f); }; requestAnimationFrame(f); }
function vram_diet() {
  const t0 = performance.now(), v3 = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), sz = new THREE.Vector3(), GE = new Map(), SRC = new Map();
  const geoInfo = g => { let e = GE.get(g); if (e) return e; e = { u: 1, bb: null };
    try { if (!g.boundingBox) g.computeBoundingBox(); e.bb = g.boundingBox; const uv = g.attributes && g.attributes.uv;
      if (uv && uv.array && uv.count) { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; const A = uv.array, st = uv.itemSize || 2, step = Math.max(1, Math.floor(uv.count / 20000));
        for (let i = 0; i < uv.count; i += step) { const x = A[i * st], y = A[i * st + 1]; if (x < a) a = x; if (x > b) b = x; if (y < c) c = y; if (y > d) d = y; }
        e.u = Math.max(.05, Math.min(64, Math.max(b - a, d - c))); } } catch (er) {} GE.set(g, e); return e; };
  scene.updateMatrixWorld(true);
  scene.traverse(o => {
    if (!o.isMesh || !o.geometry || !o.material || o.isBatchedMesh) return; const haut = !!o.isSkinnedMesh;
    const ge = geoInfo(o.geometry); if (!ge.bb) return; o.matrixWorld.decompose(v3, q, sc); ge.bb.getSize(sz); let smax = Math.max(Math.abs(sc.x), Math.abs(sc.y), Math.abs(sc.z));
    if (o.isInstancedMesh && o.instanceMatrix && o.instanceMatrix.array) { const A = o.instanceMatrix.array; let m = 0; for (let i = 0; i < o.count; i++) { const k = i * 16; m = Math.max(m, Math.hypot(A[k], A[k + 1], A[k + 2]), Math.hypot(A[k + 4], A[k + 5], A[k + 6]), Math.hypot(A[k + 8], A[k + 9], A[k + 10])); } smax *= m || 1; }
    const L = Math.max(.02, Math.max(sz.x, sz.y, sz.z) * smax);
    for (const m of [].concat(o.material)) { if (!m) continue;
      for (const k in m) { const t = m[k]; if (!(t && t.isTexture && t.isCompressedTexture && t.mipmaps && t.mipmaps.length > 1)) continue;
        const s = t.source; if (!s) continue; let e = SRC.get(s); if (!e) { e = { minD: 1e9, frei: false, tex: new Set(), w: t.mipmaps[0].width || 0 }; SRC.set(s, e); } e.tex.add(t);
        const rep = t.repeat ? Math.max(Math.abs(t.repeat.x), Math.abs(t.repeat.y), 1e-3) : 1; const dd = e.w * ge.u * rep / L; e.minD = Math.min(e.minD, haut ? dd / 2 : dd); }
      if (m.isShaderMaterial) for (const k in m.uniforms || {}) { const t = m.uniforms[k] && m.uniforms[k].value; if (t && t.isTexture && t.source) { const e = SRC.get(t.source) || { minD: 1e9, tex: new Set(), w: 0 }; e.frei = true; SRC.set(t.source, e); } } } });
  const R = renderer.properties; let mbSaved = 0;
  for (const [s, e] of SRC) {
    if (e.frei || !e.w || e.minD >= 1e9) { VRAM.hist.frei = (VRAM.hist.frei || 0) + 1; continue; }
    if (s.__kcut !== undefined) continue; try { const P = R.get(s); if (P && P.__version !== undefined) continue; } catch (er) {} // schon hochgeladen → in Ruhe lassen
    let n = 0, d = e.minD; while (n < 2 && d / 2 >= VRAM.T && (e.w >> (n + 1)) >= 256) { n++; d /= 2; }
    s.__kcut = n; VRAM.hist[e.w + '/' + n] = (VRAM.hist[e.w + '/' + n] || 0) + 1; if (!n) continue;
    for (const t of e.tex) { if (!t.mipmaps || t.mipmaps.length <= n + 1) continue; for (let i = 0; i < n; i++) { const m = t.mipmaps[i]; if (m && m.data) { mbSaved += m.data.byteLength; m.data = null; } } t.mipmaps = t.mipmaps.slice(n);
      const im = s.data; if (im && typeof im === 'object') { im.width = t.mipmaps[0].width; im.height = t.mipmaps[0].height; } }
    VRAM.cut++;
  }
  VRAM.ntex = SRC.size; VRAM.savedMB = Math.round(mbSaved / 1048576); VRAM.ms = Math.round(performance.now() - t0);
}
WORLD_MODS.push(['VRAM-Diät', async () => { if (VRAM.off || (typeof LITE !== 'undefined' && LITE)) return; try { vram_dedupSync(); } catch (e) { console.warn('VRAM-Dedup', e); } try { vram_diet(); } catch (e) { console.warn('VRAM-Diät', e); } }]);
// Geometrien, die erst nach dem Laden entstehen (Zusammenfassen/Instanzen/Deko): weitere Durchgänge nach „Fertig“, beim Spielstart und danach alle 40 s (je Durchgang verteilt)
if (!VRAM.off) { let tk = 0, st0 = -1; setInterval(() => { try { if (!window.__ready) return; tk++; if (state.started && st0 < 0) st0 = tk; const d = tk - st0;
    if (tk === 3 || (st0 >= 0 && (d === 15 || (d > 15 && d % 40 === 0)))) vram_dedupLauf(); } catch (e) {} }, 1000); }
window.__vramDedup = vram_dedupLauf;
window.__vram = VRAM;

// =====================================================================  RESIDENZ-MANAGER (10.10.2026)
// Gemessen: Verborgene Gruppen (Innenräume io_*, Regionen ow_*, geparkte Figuren/Kino-Klone, 2 874 Wurzeln) halten 2,4 GB Grafikspeicher (Texturen 1,7 GB, Geometrie 0,7 GB), obwohl sie
// nicht gezeichnet werden (das Laden lädt alles hoch, damit nichts im Spiel hochgeladen werden muss).
// Regeln (auf Sicherheit gebaut, nie „schwarze“ Texturen):
//  · Nur Wurzeln, die ≥ 20 s ununterbrochen verborgen sind (oberster Knoten mit visible = false) UND entweder „geparkt“ (Ursprung/unter der Erde) oder > 120 m (Innenräume 80 m) entfernt.
//  · Es werden nur Texturen/Geometrien freigegeben, die kein SICHTBARER Knoten benutzt. Die CPU-Daten der KTX-Texturen werden vorher wiederhergestellt und ANGEHEFTET (s.__kpin,
//    ktxSweep gibt sie nicht frei): wird eine Textur doch gebraucht, lädt three.js sie beim ersten Zeichnen synchron aus den CPU-Daten hoch (Ruckler, nie schwarz).
//  · Wiederherstellen: (a) Annäherung unter 80 m (Innenräume 45 m): Texturen nacheinander (4 je Durchgang) hochladen; (b) Sichtbarwerden der Wurzel (visible-Zugriffsfunktion):
//    sofort synchron hochladen, bevor das Bild gezeichnet wird.
// STAND: nur mit ?resi aktiv (Versuch, standardmäßig AUS): Messung Plateau nach 4 min: Grafikspeicher −0,4…−0,5 GB (nur Geometrie; mit ?resitex zusätzlich Texturen −0,5 GB bei +1,4 GB RAM),
// aber Bildzeit +6…18 ms (p95 Straße 42 → 60 ms: Durchläufe über 46 000 Knoten) und Einblend-Ruckler. Fazit in docs/gameplay/leistung_1010.md §4. Zahlen: window.__resi
const RESI = { texModus: /[?&]resitex/.test(location.search), off: !/[?&]resi/.test(location.search) || (typeof LITE !== 'undefined' && LITE), roots: new Map(), ev: 0, evTex: 0, evGeo: 0, rest: 0, restTex: 0, hitchMs: 0, q: [], log: [] };
const RESI_PARK = r => (r.rad < 3 && Math.abs(r.x) < 3 && Math.abs(r.z) < 3) || r.y < -20;
function resi_info(root) {
  const bs = new THREE.Box3(), b = new THREE.Box3(), v = new THREE.Vector3(); let n = 0; root.updateWorldMatrix(true, true);
  root.traverse(o => { if (!o.geometry || n > 400) return; n++; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); if (o.geometry.boundingBox) { b.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); bs.union(b); } });
  if (bs.isEmpty()) { root.getWorldPosition(v); bs.setFromCenterAndSize(v, new THREE.Vector3(1, 1, 1)); }
  const c = bs.getCenter(new THREE.Vector3()), s = bs.getSize(new THREE.Vector3());
  return { x: c.x, y: c.y, z: c.z, rad: Math.max(s.x, s.z) / 2, box: bs.clone() };
}
function resi_dist(box, p) { const dx = Math.max(box.min.x - p.x, 0, p.x - box.max.x), dz = Math.max(box.min.z - p.z, 0, p.z - box.max.z); return Math.hypot(dx, dz); }
function resi_istTex(t) { return t && t.isTexture && !t.isRenderTargetTexture && !t.isCubeTexture && !t.isVideoTexture && !t.isDataTexture && !t.isCanvasTexture && !t.isDepthTexture; }
function resi_res(root) { // Ressourcen eines Teilbaums: KTX-/Bildtexturen und Geometrien
  const T = new Set(), Ge = new Set();
  root.traverse(o => { if (o.geometry) Ge.add(o.geometry);
    for (const m of [].concat(o.material || [])) { if (!m) continue; for (const k in m) { const t = m[k]; if (resi_istTex(t)) T.add(t); } if (m.uniforms) for (const k in m.uniforms) { const t = m.uniforms[k] && m.uniforms[k].value; if (resi_istTex(t)) T.add(t); } } });
  return { T, Ge };
}
function resi_gebraucht() { // Ressourcen sichtbarer Knoten
  const T = new Set(), Ge = new Set();
  scene.traverseVisible(o => { if (o.geometry) Ge.add(o.geometry);
    for (const m of [].concat(o.material || [])) { if (!m) continue; for (const k in m) { const t = m[k]; if (t && t.isTexture) T.add(t); } if (m.uniforms) for (const k in m.uniforms) { const t = m.uniforms[k] && m.uniforms[k].value; if (t && t.isTexture) T.add(t); } } });
  return { T, Ge };
}
function resi_unpin(t) { const s = t.source; if (s && s.__kpin) { s.__kpin = false; return true; } return false; }
function resi_restoreSync(root, why) { // alle freigegebenen Texturen des Teilbaums sofort wieder hochladen
  const E = RESI.roots.get(root); if (!E || (E.state !== 'ev' && E.state !== 'prefetch')) return; const t0 = performance.now(); let n = 0;
  for (const t of E.tex) { try { renderer.initTexture(t); n++; } catch (e) {} resi_unpin(t); }
  E.tex = []; E.state = 'res'; E.hid = 0; RESI.rest++; RESI.restTex += n; const ms = performance.now() - t0; RESI.hitchMs = Math.max(RESI.hitchMs, ms);
  if (RESI.log.length < 60) RESI.log.push([why, E.name, n, Math.round(ms)]);
}
function resi_zugriff(root) { // visible-Zugriffsfunktion: Sichtbarwerden löst die Wiederherstellung VOR dem Zeichnen aus
  if (root.__resiAcc) return; let v = root.visible; root.__resiAcc = true;
  Object.defineProperty(root, 'visible', { configurable: true, enumerable: true, get() { return v; }, set(x) { if (x && !v) { const E = RESI.roots.get(root); if (E && (E.state === 'ev' || E.state === 'prefetch')) resi_restoreSync(root, 'sichtbar'); } v = x; } });
}
function resi_entladen(root, E, tex, geo) {
  let nt = 0, ng = 0; E.tex = []; E.geo = [];
  for (const t of tex) { try { t.dispose(); E.tex.push(t); nt++; } catch (e) {} }
  for (const g of geo) { try { g.dispose(); E.geo.push(g); ng++; } catch (e) {} }
  E.state = 'ev'; RESI.ev++; RESI.evTex += nt; RESI.evGeo += ng; resi_zugriff(root);
  if (RESI.log.length < 60) RESI.log.push(['entladen', E.name, nt, ng]);
}
function* resi_gen() {
  const P = player.pos; let n = 0;
  const found = [], walk = o => { for (const c of o.children) { if (!c.visible) found.push(c); else if (c.children.length) walk(c); } }; walk(scene); yield;
  const now = performance.now(), seen = new Set();
  for (const r of found) { seen.add(r); let E = RESI.roots.get(r); if (!E) { E = { state: 'res', hid: now, tex: [], geo: [], info: null, name: r.name || '' }; RESI.roots.set(r, E); } else if (!E.hid) E.hid = now; if (++n % 60 === 0) yield; }
  for (const [r, E] of RESI.roots) { if (!seen.has(r) && E.state === 'res') E.hid = 0; }
  // Prefetch: entladene Wurzeln in Reichweite zurückholen
  for (const [r, E] of RESI.roots) { if (E.state !== 'ev' || !E.info) continue; const rad = /^io_/.test(E.name) ? 45 : 80;
    if (!RESI_PARK(E.info) && resi_dist(E.info.box, P) < rad) { E.state = 'prefetch'; RESI.q.push(r); } }
  // Entladen: je Durchgang bis zu 12 Wurzeln, die am weitesten weg bzw. geparkt sind
  const cand = [];
  for (const [r, E] of RESI.roots) { if (E.state !== 'res' || !E.hid || now - E.hid < 20000 || E.bad) continue; if (!E.info) { E.info = resi_info(r); yield; }
    const park = RESI_PARK(E.info), rad = /^io_/.test(E.name) ? 80 : 120, d = resi_dist(E.info.box, P);
    if (park || d > rad) cand.push([d, r, E]); }
  if (cand.length) { cand.sort((a, b) => b[0] - a[0]); yield; const used = resi_gebraucht(); yield;
    for (const [d, r, E] of cand.slice(0, 12)) { const res = resi_res(r);
      const tex = RESI.texModus ? [...res.T].filter(t => !used.T.has(t)) : [], geo = [...res.Ge].filter(g => !used.Ge.has(g)); // Texturen nur im Versuchsmodus (RESI.texModus): +1,4 GB RAM für −0,5 GB VRAM gemessen
      if (!tex.length && !geo.length) { E.bad = true; yield; continue; }
      let need = 0; for (const t of tex) { const s = t.source; if (t.isCompressedTexture && s && s.__kre) { s.__kpin = true; if (s.__kfree) { need++; if (!s.__kbusy && KTXF.busy < 3) ktxRestore(s); } } }
      if (need) { E.state = 'warte'; E.wait = { tex, geo, t0: performance.now() }; } else resi_entladen(r, E, tex, geo);
      yield; } }
  // Wartende: sind die CPU-Daten wieder da?
  for (const [r, E] of RESI.roots) { if (E.state !== 'warte') continue; const W = E.wait; let ok = true;
    for (const t of W.tex) { const s = t.source; if (t.isCompressedTexture && s && s.__kfree) { ok = false; if (!s.__kbusy && KTXF.busy < 3) ktxRestore(s); } }
    if (ok) { E.wait = null; resi_entladen(r, E, W.tex, W.geo); }
    else if (performance.now() - W.t0 > 90000) { for (const t of W.tex) resi_unpin(t); E.state = 'res'; E.bad = true; E.wait = null; }
    yield; }
  // Prefetch-Warteschlange: 4 Texturen je Durchgang
  if (RESI.q.length) { const r = RESI.q[0], E = RESI.roots.get(r);
    if (!E || E.state !== 'prefetch') RESI.q.shift();
    else { for (let i = 0; i < 4 && E.tex.length; i++) { const t = E.tex.pop(); try { renderer.initTexture(t); RESI.restTex++; } catch (e) {} resi_unpin(t); }
      if (!E.tex.length) { E.state = 'res'; E.hid = 0; RESI.rest++; RESI.q.shift(); } } }
}
if (!RESI.off) { let it = null, last = 0;
  setInterval(() => { try { if (!window.__ready || !state.started || state.paused) return; if (!it) { if (performance.now() - last < 600) return; it = resi_gen(); }
      const t0 = performance.now(); while (performance.now() - t0 < 3) { if (it.next().done) { it = null; last = performance.now(); break; } } }
    catch (e) { it = null; if (!RESI.err) { RESI.err = String(e); console.warn('Residenz', e); } } }, 33); }
window.__resi = RESI;
