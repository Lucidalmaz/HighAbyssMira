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


def apply(s):
    for a, b, n in ((SWEEP_OLD, SWEEP_NEW, 'ktxSweep'), (FETCH_OLD, FETCH_NEW, 'fetch'), (LIS_OLD, LIS_NEW, 'loadImageSource'), (DEDUPE_OLD, DEDUPE_NEW, 'texDedupe'), (UP_OLD, UP_NEW, 'Hochladen')):
        assert s.count(a) == 1, 'stream_patch: ' + n + ' nicht (genau einmal) gefunden'
        s = s.replace(a, b)
    return s
