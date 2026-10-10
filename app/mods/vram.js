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
