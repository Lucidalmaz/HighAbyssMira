# stream: Eingriffe in die Basis für das Textur-Streaming (mods/stream.js)
#  1. ktxSweep: Stufen <= STR.KEEPW bleiben als kleine CPU-Kopie (sofortiges Herabstufen), s.__kpin wird beachtet, Haltezeit nach Wiederherstellen (STR.HOLD)
#  2. stream_load() nach texDedupe: Registratur + Fenster für die Startposition VOR dem Hochladen (die Basis lädt dann nur Fenster hoch)
#  3. Hochlade-Durchgang: verborgene Formen nicht sichtbar schalten (ihre Formen gehen erst beim ersten Zeichnen auf die Grafikkarte)

SWEEP_OLD = """function ktxSweep() {
  if (!KTXF.on) return; const R = renderer.properties; let n = 0, b = 0;
  for (const s of KTXF.list) { if (s.__kfree || s.__kbusy) continue; const P = R.get(s); if (P.__version === undefined || P.__version !== s.version) continue;
    for (const m of s.__kmips) if (m && m.data) { b += m.data.byteLength; m.data = null; } s.__kfree = true; n++; }
  KTXF.freed += n; KTXF.mb += b / 1048576;
}"""

SWEEP_NEW = """function ktxSweep() {
  if (!KTXF.on) return; const R = renderer.properties; let n = 0, b = 0; const KW = typeof STR !== 'undefined' && STR.ready ? STR.KEEPW : 0, now = performance.now();
  for (const s of KTXF.list) { if (s.__kfree || s.__kbusy || s.__kpin) continue; const P = R.get(s); if (P.__version === undefined || P.__version !== s.version) continue;
    if (KW && !s.__ktail && !s.__kh) { s.__kh = now; continue; } // Streaming: frisch wiederhergestellte Daten kurz halten (Herabstufen ohne neues Laden)
    if (KW && !s.__ktail && now - s.__kh < STR.HOLD) continue; s.__kh = 0;
    for (const m of s.__kmips) { if (!m || !m.data) continue; if (KW && Math.max(m.width, m.height) <= KW) { if (!m.__kc) { m.data = m.data.slice(); m.__kc = true; } continue; } b += m.data.byteLength; m.data = null; }
    s.__kfree = !((KW && s.__ktail) || s.__kmips.every(m => m && m.data)); n++; }
  KTXF.freed += n; KTXF.mb += b / 1048576;
}"""

DEDUPE_OLD = "try { texDedupe(); } catch (e) { console.warn('Texturen', e); }\n"
DEDUPE_NEW = "try { texDedupe(); } catch (e) { console.warn('Texturen', e); }\ntry { if (typeof stream_load === 'function') stream_load(); } catch (e) { console.warn('Stream', e); } // Textur-Streaming: Fenster für die Startposition vor dem Hochladen\n"

UP_OLD = "if (o.isLight) { o.visible = LSET.has(o); return; } o.visible = true; o.frustumCulled = false; o.layers.enable(0);"
UP_NEW = "if (o.isLight) { o.visible = LSET.has(o); return; } if (typeof stream_skipUpload === 'function' && stream_skipUpload(o)) return; o.visible = true; o.frustumCulled = false; o.layers.enable(0);"

# Ladezeit (12.10.): (1) FileLoader zerlegt jede Antwort in einen Lese-Strom mit ProgressEvent je Block (gemessen 3,5 s Hauptfaden beim Laden): Antworten ohne Stromzugriff geben
# (Response.body als eigene Eigenschaft undefined) → three.js nimmt den Kurzweg „return response“. Nur Request-Objekte (so ruft FileLoader fetch auf), alles andere unverändert.
FETCH_OLD = "const KTX = { loader: null, img: new Set(), mdl: new Set(), cache: new Map(), pending: [] };\n"
FETCH_NEW = FETCH_OLD + "if (!/noffast/.test(location.search)) { const _fetch0 = window.fetch.bind(window); window.fetch = function (a, ...r) { const p = _fetch0(a, ...r); if (!(a instanceof Request)) return p; return p.then(rs => { try { Object.defineProperty(rs, 'body', { value: undefined, configurable: true }); } catch (e) {} return rs; }); }; }\n"
# (2) GLB-Bilder (KTX2) direkt aus der bufferView an den KTX2-Lader statt Blob → Objekt-URL → fetch (gemessen 3,3 s Hauptfaden: Blob-Kopie je Bild)
LIS_OLD = "p.loadImageSource = (si, loader) => { const pr = lis(si, loader);"
LIS_NEW = "p.loadImageSource = (si, loader) => { const pr = (typeof ktx_fast === 'function' && ktx_fast(p, si, loader)) || lis(si, loader);"

# Texturen, die nur Fernes/Verborgenes brauchen (Fenster = nur Restketten ≤ KEEPW), werden beim Laden nicht hochgeladen (je Stufe ein eigener GL-Aufruf: gemessen 3,5 s + 2 s auf dem
# Hauptfaden); sie gehen beim ersten Zeichnen bzw. über das Streaming auf die Grafikkarte.
TEX1_OLD = "for (const t of texs) { try { renderer.initTexture(t); } catch (e) {} } } catch (e) { console.warn('Texturen vorab', e); }"
TEX1_NEW = "for (const t of texs) { if (typeof stream_texNeeded === 'function' && !stream_texNeeded(t)) continue; try { renderer.initTexture(t); } catch (e) {} } } catch (e) { console.warn('Texturen vorab', e); }"
TEX2_OLD = "    for (const t of texs) { try { renderer.initTexture(t); } catch (e) {} }\n    // In Häppchen rendern"
TEX2_NEW = "    for (const t of texs) { if (typeof stream_texNeeded === 'function' && !stream_texNeeded(t)) continue; try { renderer.initTexture(t); } catch (e) {} }\n    // In Häppchen rendern"

# Beim Laden nur Programme für Nahes übersetzen (Sichtbares < RC m, Verborgenes < RCH m, Figuren-Vorlagen immer); der Rest wird von der Shader-Wache (leistung.js) im Hintergrund nachgeholt
# – sichtbar erst, wenn das Programm fertig ist. Kalt (leerer Shader-Cache) halbiert das die Ladezeit, warm spart es das Zusammensetzen der Shadertexte (je Programm ~12–25 ms).
CMP_OLD = "const compiling = Promise.all([renderer.compileAsync(scene, camera), "
CMP_NEW = "const compiling = Promise.all([renderer.compileAsync((typeof stream_compileRoot === 'function' && stream_compileRoot()) || scene, camera, scene), "
SHD_OLD = "if (!(o.isMesh || o.isLine || o.isPoints) || !o.castShadow || !o.material) return; const M = o.material, cu = pt ? o.customDistanceMaterial : o.customDepthMaterial;"
SHD_NEW = "if (!(o.isMesh || o.isLine || o.isPoints) || !o.castShadow || !o.material || (typeof stream_compileSel === 'function' && !stream_compileSel(o))) return; const M = o.material, cu = pt ? o.customDistanceMaterial : o.customDepthMaterial;"

# Früh-Übersetzen (während die Module bauen): ebenfalls nur Nahes (stream_earlySel), sonst bliebe die Grafikkarte kalt minutenlang mit allem beschäftigt
ERL_OLD = "EARLY.seen.add(o); const M = [].concat(o.material); if (M.length && M.every(earlyOk)) EARLY.pend.push(o);"
ERL_NEW = "EARLY.seen.add(o); const M = [].concat(o.material); if (M.length && M.every(earlyOk) && (typeof stream_earlySel !== 'function' || stream_earlySel(o))) EARLY.pend.push(o);"

# Während der Nachbereitung (Hochladen, Schattenbild) zeichnet die Hauptschleife keine vollen Bilder (die Leinwand ist ohnehin verdeckt): jedes Bild kostete vorher die ganze Szene und
# übersetzte dabei noch nicht fertige Programme blockierend (gemessen: onFirstUse 9 s im Hochlade-Abschnitt, 12.10.2026). Das Flag wird vor „Fertig“ ohnehin zurückgesetzt.
LOOP_OLD = "loop();\nstage('Erstes Bild fertig');"
LOOP_NEW = "LOAD_NORENDER.on = true; loop();\nstage('Erstes Bild fertig');"

# Verborgene oberste Gruppen (Innenräume, Regionen, Figuren-Klone ohne Licht) werden beim Laden nicht sichtbar geschaltet: die Basis zwang alle Gruppen sichtbar, um alles hochzuladen und
# zu übersetzen – das zog auch alles Verborgene und Ferne in die Übersetzung/den Upload (siehe stream.js).
ALL1_OLD = "all.forEach(o => { saved.set(o, o.visible); o.visible = true; });"
ALL1_NEW = "all.forEach(o => { saved.set(o, o.visible); if (!(typeof stream_keepHidden === 'function' && stream_keepHidden(o))) o.visible = true; });"
ALL2_OLD = "all.forEach(o => o.visible = true); lsetApply();"
ALL2_NEW = "all.forEach(o => { if (!(typeof stream_keepHidden === 'function' && stream_keepHidden(o))) o.visible = true; }); lsetApply();"

# Nachbearbeitungs-Programme (Bloom-Weichzeichner je Stufe, Tonwert, Film …) parallel zum Gesamtdurchgang übersetzen: sie entstanden sonst erst im Schattenbild einzeln und blockierend
PASS_OLD = "const compiling = Promise.all([renderer.compileAsync((typeof stream_compileRoot === 'function' && stream_compileRoot()) || scene, camera, scene), "
PASS_NEW = "const compiling = Promise.all([(typeof stream_passCompile === 'function' ? stream_passCompile() : null), renderer.compileAsync((typeof stream_compileRoot === 'function' && stream_compileRoot()) || scene, camera, scene), "

# Beim Nachbereiten (LOAD_NORENDER) keine Spiellogik je Bild: die Schleife lief im Hochlade-Abschnitt weiter (update + Matrizen ≈ 1,5 s Hauptfaden), obwohl nichts gezeichnet wird.
UPD_OLD = "try { if (!frozen) { update(dt, t); gtAdvance(Math.min(raw, .25) * 1000); } else flashHudTick(dt); }"
UPD_NEW = "try { if (LOAD_NORENDER.on && !state.started) { gtAdvance(Math.min(raw, .25) * 1000); /* Laden: keine Spiellogik, nur die Spielzeit (wait() läuft darauf) */ } else if (!frozen) { update(dt, t); gtAdvance(Math.min(raw, .25) * 1000); } else flashHudTick(dt); }"

# Wiederherstellen eines Bildes aus einer großen Modelldatei: Bereichsabfrage (nur das Bild) statt der ganzen .ktx.glb (gemessen: Wiederherstellungsdurchsatz im Ortskern ~5 Bilder/s)
RST_OLD = "    if (r.bv) { let p = KTXF.glb.get(r.url); if (!p) {"
RST_NEW = "    if (r.bv && !/norange/.test(location.search)) { const o0 = r.binOff + (r.bv.byteOffset || 0), n0 = r.bv.byteLength; try { const rs = await fetch(r.url, { headers: { Range: 'bytes=' + o0 + '-' + (o0 + n0 - 1) } }); if (rs.status === 206) { const ab0 = await rs.arrayBuffer(); if (ab0.byteLength === n0) buf = ab0; } } catch (e) {} }\n    if (r.bv && !buf) { let p = KTXF.glb.get(r.url); if (!p) {"

RST2_OLD = "    else buf = await (await fetch(r.url)).arrayBuffer();"
RST2_NEW = "    else if (!r.bv) buf = await (await fetch(r.url)).arrayBuffer();"


def apply(s):
    for a, b, n in ((SWEEP_OLD, SWEEP_NEW, 'ktxSweep'), (FETCH_OLD, FETCH_NEW, 'fetch'), (LIS_OLD, LIS_NEW, 'loadImageSource'), (TEX1_OLD, TEX1_NEW, 'Texturen vorab'), (CMP_OLD, CMP_NEW, 'Gesamtuebersetzung'), (RST_OLD, RST_NEW, 'ktxRestore'), (RST2_OLD, RST2_NEW, 'ktxRestore2'), (UPD_OLD, UPD_NEW, 'update'), (PASS_OLD, PASS_NEW, 'Pass'), (ALL1_OLD, ALL1_NEW, 'all1'), (ALL2_OLD, ALL2_NEW, 'all2'), (LOOP_OLD, LOOP_NEW, 'loop'), (ERL_OLD, ERL_NEW, 'Frueh'), (SHD_OLD, SHD_NEW, 'Schattenprogramme'), (TEX2_OLD, TEX2_NEW, 'Texturen hochladen'), (DEDUPE_OLD, DEDUPE_NEW, 'texDedupe'), (UP_OLD, UP_NEW, 'Hochladen')):
        assert s.count(a) == 1, 'stream_patch: ' + n + ' nicht (genau einmal) gefunden'
        s = s.replace(a, b)
    return s
