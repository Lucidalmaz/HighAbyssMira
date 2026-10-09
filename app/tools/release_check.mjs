// Prüfung vor der Veröffentlichung: Hat jedes Bild und jedes Modell, das das Spiel über TextureLoader/GLTFLoader lädt, eine aktuelle KTX2-Fassung?
// Gleiche Regeln wie tools/ktx.mjs: game/assets/**/*.jpg|png → <datei>.ktx2, **/*.glb|gltf → <datei>.ktx.glb, und alles steht in assets/ktx2.json
// (das Spiel nimmt nur, was dort steht). Erlaubt ohne KTX: Bilder, deren Maße (nach Verkleinern auf ≤ 2048) kein Vielfaches von 4 sind, und Modelle
// ohne JPEG/PNG-Texturen – genau die überspringt auch ktx.mjs.
// Aufruf: node tools/release_check.mjs [--list]   Rückgabe 1, wenn etwas fehlt oder veraltet ist (bricht `npm run release` ab).
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), GAME = path.resolve(HERE, '..', '..', 'game'), ASSETS = path.join(GAME, 'assets');
const rel = f => path.relative(GAME, f).split(path.sep).join('/');
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else out.push(p); } return out; };
const fits = (w, h) => w >= 4 && h >= 4 && w % 4 === 0 && h % 4 === 0;
const shrink = (w, h) => { const m = Math.max(w, h); if (m <= 2048) return [w, h]; const k = 2048 / m; return [Math.round(w * k), Math.round(h * k)]; };

if (!fs.existsSync(ASSETS)) { console.error('Keine Spieldateien: ' + ASSETS); process.exit(1); }
let sharp = null; try { sharp = (await import('sharp')).default; } catch (e) { console.warn('Hinweis: sharp fehlt – Bildmaße werden nicht geprüft, jede Datei ohne KTX gilt als fehlend.'); }
const imageFits = async buf => { if (!sharp) return true; try { const m = await sharp(buf).metadata(); return fits(...shrink(m.width, m.height)); } catch (e) { return true; } };

// Texturen eines Modells, die ktx.mjs umwandeln würde (JPEG/PNG mit passenden Maßen)
async function modelNeedsKtx(f) {
  const buf = fs.readFileSync(f); let json, bin = null;
  if (/\.glb$/i.test(f)) {
    if (buf.readUInt32LE(0) !== 0x46546C67) return false; let o = 12;
    while (o < buf.length) { const len = buf.readUInt32LE(o), type = buf.readUInt32LE(o + 4), data = buf.subarray(o + 8, o + 8 + len);
      if (type === 0x4E4F534A) json = JSON.parse(data.toString('utf8')); else if (type === 0x004E4942) bin = data; o += 8 + len; }
  } else json = JSON.parse(buf.toString('utf8'));
  if (!json || !json.images || !json.textures) return false;
  const used = new Set(json.textures.map(t => t.source).filter(i => i != null));
  for (const i of used) { const im = json.images[i]; if (!im) continue;
    const mime = im.mimeType || (/\.png$/i.test(im.uri || '') ? 'image/png' : /\.jpe?g$/i.test(im.uri || '') ? 'image/jpeg' : '');
    if (mime !== 'image/jpeg' && mime !== 'image/png') continue;
    let data = null;
    if (im.bufferView != null && bin) { const bv = json.bufferViews[im.bufferView]; data = bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength); }
    else if (im.uri && im.uri.startsWith('data:')) data = Buffer.from(im.uri.split(',')[1], 'base64');
    else if (im.uri) { const p = path.join(path.dirname(f), decodeURIComponent(im.uri)); if (fs.existsSync(p)) data = fs.readFileSync(p); }
    if (!data || await imageFits(data)) return true; }
  return false;
}

const all = walk(ASSETS), list = (() => { try { return JSON.parse(fs.readFileSync(path.join(ASSETS, 'ktx2.json'), 'utf8')); } catch (e) { return null; } })();
if (!list) { console.error('FEHLT: assets/ktx2.json – erst node tools/ktx.mjs'); process.exit(1); }
const listed = { images: new Set(list.images || []), models: new Set(list.models || []) };
const DOM_ONLY = ['assets/fotos/']; // Fotos der Ermittlungswand: <img>/Leinwand im Tagebuch, nie über TextureLoader → brauchen kein KTX
const srcs = all.filter(f => (/\.(jpe?g|png)$/i.test(f) || (/\.(glb|gltf)$/i.test(f) && !/\.ktx\.glb$/i.test(f))) && !DOM_ONLY.some(p => rel(f).startsWith(p)));
const bad = [], skipped = []; let ok = 0;
for (const f of srcs) {
  const model = /\.(glb|gltf)$/i.test(f), out = f + (model ? '.ktx.glb' : '.ktx2'), r = rel(f);
  const fresh = fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(f).mtimeMs, inList = (model ? listed.models : listed.images).has(r);
  if (fresh && inList) { ok++; continue; }
  const needs = model ? await modelNeedsKtx(f).catch(() => true) : await imageFits(fs.readFileSync(f));
  if (!needs) { skipped.push(r); continue; }
  bad.push(r + (!fs.existsSync(out) ? '  (keine KTX-Fassung)' : !fresh ? '  (KTX älter als das Original)' : '  (fehlt in ktx2.json)'));
}
// Einträge in ktx2.json, deren Datei fehlt, lädt das Spiel ins Leere
for (const r of [...listed.images].map(x => [x, '.ktx2']).concat([...listed.models].map(x => [x, '.ktx.glb']))) if (!fs.existsSync(path.join(GAME, r[0] + r[1]))) bad.push(r[0] + '  (in ktx2.json, aber ' + r[1] + ' fehlt)');
console.log(`KTX-Prüfung: ${ok} aktuell, ${skipped.length} ohne KTX erlaubt (Maße/keine Texturen), ${bad.length} fehlen oder veraltet.`);
if (process.argv.includes('--list') && skipped.length) console.log('Ohne KTX erlaubt:\n  ' + skipped.join('\n  '));
if (bad.length) { console.error('Nicht bereit für die Veröffentlichung – node tools/ktx.mjs ausführen:\n  ' + bad.slice(0, 200).join('\n  ') + (bad.length > 200 ? `\n  … und ${bad.length - 200} weitere` : '')); process.exit(1); }

// Sprachausgabe (X-1): game/assets/stimmen ist optional (fehlt der Ordner, läuft das Spiel mit Untertiteln). Ist er da, muss er stimmig sein:
// manifest.json gültig, jede Datei aus z vorhanden und Ogg, keine verwaisten .opus, Verweise in t/k/wer zeigen auf bekannte Zeilen, Gesamtgröße <= 150 MB.
{ const SD = path.join(ASSETS, 'stimmen'), mf = path.join(SD, 'manifest.json');
  if (!fs.existsSync(SD)) console.log('Stimmen: Ordner assets/stimmen fehlt – Veröffentlichung ohne Sprachausgabe (nur Untertitel).');
  else {
    const err = []; let man = null, bytes = 0, n = 0;
    try { man = JSON.parse(fs.readFileSync(mf, 'utf8')); } catch (e) { err.push('manifest.json fehlt oder ist kein gültiges JSON (' + e.message + ')'); }
    if (man) {
      if (!man.z || typeof man.z !== 'object' || !man.t || typeof man.t !== 'object') err.push('manifest.json ohne z/t');
      else {
        const files = new Set();
        for (const [id, v] of Object.entries(man.z)) { n++; files.add(v[0]); const f = path.join(SD, v[0]);
          if (!fs.existsSync(f)) { err.push(id + ': Datei fehlt (' + v[0] + ')'); continue; }
          const st = fs.statSync(f); bytes += st.size; const fd = fs.openSync(f, 'r'), h = Buffer.alloc(4); fs.readSync(fd, h, 0, 4, 0); fs.closeSync(fd);
          if (st.size < 200 || h.toString('latin1') !== 'OggS') err.push(id + ': keine gültige Ogg-Datei (' + v[0] + ')');
          if (!(v[1] > 0.1 && v[1] < 60)) err.push(id + ': unplausible Dauer ' + v[1]); }
        for (const f of fs.readdirSync(SD)) if (/\.opus$/i.test(f) && !files.has(f)) err.push('verwaiste Datei ' + f);
        for (const [t, ids] of Object.entries(man.t)) for (const i of ids) if (!man.z[i]) err.push('t "' + t.slice(0, 30) + '": unbekannte ID ' + i);
        for (const [k, v] of Object.entries(man.k || {})) for (const i of [].concat(v)) if (!man.z[i]) err.push('k ' + k + ': unbekannte ID ' + i);
        const figuren = new Set(Object.values(man.z).map(v => v[2]));
        for (const [w, s] of Object.entries(man.wer || {})) for (const f of String(s).split('+')) if (f && !figuren.has(f)) { /* Figur ohne Aufnahme: erlaubt (bleibt stumm) */ }
      }
      if (bytes > 150e6) err.push(`Stimmen ${(bytes / 1e6).toFixed(0)} MB > 150 MB`);
    }
    console.log(`Stimmen: ${n} Zeilen, ${(bytes / 1e6).toFixed(1)} MB, ${err.length} Fehler.`);
    if (err.length) { console.error('Stimmen nicht bereit:\n  ' + err.slice(0, 100).join('\n  ')); process.exit(1); }
  } }
