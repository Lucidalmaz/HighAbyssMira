// QA-Inventar (09.10.2026): alle Interaktionen und Sammel-Quellen aus dem Quelltext (statisch) + optional aus einem Lite-Lauf (Laufzeit,
// Erreichbarkeit per Strahltest, siehe C:/Users/GIGABYTE/_qa/qa_lib.js) → docs/gameplay/qa_inventar.md
// Aufruf: node tools/qa_inventar.js [lauf/steps.json] [--json out.json]
//   ohne Lauf: nur statische Fundstellen (Datei:Zeile, Label, Koordinaten-Argumente, umgebende Funktion)
//   mit Lauf (Ausgabe von _run_lite.sh mit _qa/qa_steps.json): je Kapitel alle Netze mit userData.action, Bedingung (Label-Funktion/Aktionskopf),
//   Wirkung (Aktions-Quelltext), Quelle (Datei:Zeile über den Quelltext der Aktion), Erreichbarkeit (gültige Standpunkte von 12) und Befund.
const fs = require('fs'), path = require('path');
const MODS = path.join(__dirname, '..', 'mods'), DOC = path.join(__dirname, '..', '..', 'docs', 'gameplay', 'qa_inventar.md');
const args = process.argv.slice(2), runFile = args.find(a => !a.startsWith('--') && a.endsWith('.json') && args[args.indexOf(a) - 1] !== '--json');
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const files = fs.readdirSync(MODS).filter(f => f.endsWith('.js') || f === '_base_source_index.html').sort();
const SRC = {}; for (const f of files) SRC[f] = fs.readFileSync(path.join(MODS, f), 'utf8');

// ---------- Hilfen: Klammer-Ende und Argumente (Strings, Template-Literale, Kommentare beachtet)
function argsAt(s, open) { // s[open] === '('
  const out = []; let depth = 0, i = open, start = open + 1, q = null, tpl = [];
  for (; i < s.length; i++) { const ch = s[i];
    if (q) { if (ch === '\\') { i++; continue; } if (q === '`' && ch === '$' && s[i + 1] === '{') { tpl.push(depth); depth++; i++; q = null; continue; } if (ch === q) q = null; continue; }
    if (ch === '/' && s[i + 1] === '/') { const e = s.indexOf('\n', i); i = e < 0 ? s.length : e; continue; }
    if (ch === '/' && s[i + 1] === '*') { const e = s.indexOf('*/', i + 2); i = e < 0 ? s.length : e + 1; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { q = ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') { depth++; continue; }
    if (ch === ')' || ch === ']' || ch === '}') { depth--; if (tpl.length && depth === tpl[tpl.length - 1] && ch === '}') { tpl.pop(); q = '`'; continue; }
      if (depth === 0) { out.push(s.slice(start, i).trim()); return { args: out, end: i }; } continue; }
    if (ch === ',' && depth === 1) { out.push(s.slice(start, i).trim()); start = i + 1; }
    if (i - open > 20000) break; }
  return { args: out, end: i };
}
const lineOf = (s, idx) => { let n = 1; for (let i = s.indexOf('\n'); i >= 0 && i < idx; i = s.indexOf('\n', i + 1)) n++; return n; };
const lit = a => { if (!a) return ''; const m = /^(['"`])([\s\S]*)\1$/.exec(a); return m ? m[2] : a; };
const short = (t, n = 110) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const md = t => String(t || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
function enclosingFn(s, idx) { const back = s.slice(Math.max(0, idx - 6000), idx); const re = /function\s+([A-Za-z0-9_$]+)\s*\(|([A-Za-z0-9_$]+)\s*[:=]\s*(?:async\s*)?\([^)]*\)\s*=>/g; let m, last = null; while ((m = re.exec(back))) last = m[1] || m[2]; return last || ''; }

// ---------- 1. statische Fundstellen
// Klickflächen-Fabriken: Name → [Index Label, Index x, y, z] (x/y/z: Argumente mit der Lage)
const WRAP = { interact: [1], kirchberg_hit: [6, 3, 4, 5], amt_hit: [6, 0, 1, 2], kf_hit: [6, 3, 4, 5], villa_hit: [6, 3, 4, 5], neben3_ort: [6, 0, 1, 2], spot: [6, 0, 1, 2],
  anwesen_wrap: [0, 1, null, 2], ausruestung_spot: [3], tausch_glint: [3, 0, 1, 2], katzen_klick: [1], n5_huelle: [2], makeDoor: [5, 0, null, 1], steelDoor: [3, 0, null, 1], amt_tuer: [5, 1, null, 2] };
const SAMMEL = { addItem: 0, modItem: 0, lore: 0, sammeln_fibel: 0, mystFound: 0, beob_drop: 0, beobachter_zettel: 0 };
const stat = [], items = [];
for (const f of files) { const s = SRC[f];
  const re = /\b([A-Za-z0-9_$]+)\(/g; let m;
  while ((m = re.exec(s))) { const name = m[1]; const isW = Object.hasOwn(WRAP, name) && WRAP[name], isS = Object.hasOwn(SAMMEL, name); if (!isW && !isS) continue;
    const pre = s.slice(Math.max(0, m.index - 9), m.index); if (/function\s+$/.test(pre)) continue; // Definition
    if (s.length - m.index > 0 && s.slice(m.index - 1, m.index) === '.') continue;
    const A = argsAt(s, m.index + name.length); const ln = lineOf(s, m.index);
    if (isW) { const [li, xi, yi, zi] = isW; const label = A.args[li]; if (name === 'interact' && A.args.length < 3) continue;
      stat.push({ f, ln, fn: enclosingFn(s, m.index), w: name, label: lit(label), lagen: [xi, yi, zi].map(k => k == null ? '' : short(A.args[k], 18)), act: short(A.args[name === 'interact' ? 2 : li + 1], 140), wann: name === 'neben3_ort' ? short(A.args[8], 90) : '' }); }
    else items.push({ f, ln, fn: enclosingFn(s, m.index), k: name, key: lit(A.args[0]), rest: short(A.args.slice(1).join(', '), 90) });
  } }
// BEUTEL_FUNDE (beutel.js): Einträge zählen
let beutel = []; { const s = SRC['beutel.js'] || ''; const i = s.indexOf('BEUTEL_FUNDE = ['); if (i >= 0) { beutel = argsAt(s, s.indexOf('[', i)).args; } }

// ---------- 2. Laufzeit (optional)
let run = null;
if (runFile) { const st = JSON.parse(fs.readFileSync(runFile, 'utf8')); run = [];
  for (const [k, v] of Object.entries(st)) { if (!/^qa_k/.test(k)) continue; try { run.push(JSON.parse(v)); } catch (e) { run.push({ tag: k.slice(3), fehler: String(v).slice(0, 300), rows: [] }); } } }
// Quelltext-Suche: Aktions-Quelltext (Leerraum zusammengefasst) → Datei:Zeile
const NORM = {}; for (const f of files) { const s = SRC[f]; let o = '', map = []; let ws = false; for (let i = 0; i < s.length; i++) { const c = s[i]; if (/\s/.test(c)) { if (!ws) { o += ' '; map.push(i); ws = true; } } else { o += c; map.push(i); ws = false; } } NORM[f] = { o, map }; }
const findSrc = snip => { if (!snip) return ''; let t = snip.replace(/…$/, ''); for (const cut of [70, 45, 28]) { const q = t.slice(0, cut); if (q.length < 14) break;
  for (const f of files) { const N = NORM[f]; const i = N.o.indexOf(q); if (i >= 0) return f + ':' + lineOf(SRC[f], N.map[i]); } } return ''; };
const cond = r => { const c = []; if (r.lf) c.push('Label: ' + short(r.lf, 90)); const m = /^(?:\(\)|[a-z]\s*)\s*=>\s*\{?\s*(if\s*\((.{0,90}?)\)\s*(?:return|\{))/.exec(r.act || ''); if (m) c.push('if (' + short(m[2], 80) + ')'); if (!r.aktiv) c.push('derzeit inaktiv'); if (!r.sichtbar) c.push('unsichtbar'); return c.join(' · '); };
const befund = r => { const R = r.r; if (!R || typeof R !== 'object') return R === 'wie vorher' ? '' : '?'; if (R.err) return 'FEHLER ' + R.err; const f = [];
  if (R.ok === 0) f.push('**UNERREICHBAR**'); else if (R.ok < 3) f.push('Warnung: nur ' + R.ok + '/12');
  if (R.ok && R.okStand === 0 && R.okCrouch > 0) f.push('nur hockend'); if (R.ok && R.okMantle === R.ok) f.push('nur erhöht/Mantle');
  if (R.ok && R.sight < R.ok) f.push('Sicht durch Netz verdeckt ' + (R.ok - R.sight) + '×');
  const bl = Object.entries(R.block || {}).filter(([k]) => !k.startsWith('Sicht:')).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, n]) => short(k, 60) + ' ×' + n); if (bl.length && R.ok < 6) f.push('blockiert: ' + bl.join('; '));
  const mx = Math.max(...r.size); if (mx < .12) f.push('Klickfläche klein (' + mx + ' m)'); if (R.leer > 6) f.push(R.leer + ' Sektoren ohne Standplatz');
  return f.join(' · '); };

// ---------- 3. Ausgabe
const L = [];
L.push('# QA-Inventar: Interaktionen, Erreichbarkeit, Sammel-Quellen', '', '_Erzeugt von `app/tools/qa_inventar.js` am ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + (run ? ' aus dem Lite-Lauf `' + runFile.replace(/\\/g, '/') + '`' : ' (nur statisch; Laufzeitteil fehlt noch – Lite-Lauf mit `C:/Users/GIGABYTE/_qa/qa_steps.json`)') + '._', '');
L.push('Strahltest (Laufzeit): 12 Sektoren à 30° um das Objekt, je Sektor der begehbare Rasterpunkt (0,3 m) am nächsten an 1,4 m, Abstand 0,6–2,4 m zur Grundfläche;',
  'Körper frei (`tod_blockiert`, r 0,3), Boden aus Innenraum/Kisten/BVH. Auge 1,65 m (stehend) und 1,03 m (hockend); Strahl wie im Spiel (2,7 m, nur `interactables` + `occluders`).',
  'Gültig = erster Treffer ist das Objekt. „Sicht durch Netz verdeckt“ = ein festes Modell (BVH) liegt davor, der Klick geht aber durch (Spiellogik prüft keine Modelle).', '');
if (run) {
  const all = run.flatMap(k => k.rows.map(r => Object.assign({ kap: k.tag }, r)));
  const tested = all.filter(r => r.r && typeof r.r === 'object' && !r.r.err);
  const bad = tested.filter(r => r.r.ok === 0), warn = tested.filter(r => r.r.ok > 0 && r.r.ok < 3);
  L.push('## Zusammenfassung Laufzeit', '', '| Kapitel | Netze mit Aktion | davon aktiv | neu getestet | unerreichbar | < 3/12 | Hinweise |', '|---|---|---|---|---|---|---|');
  for (const k of run) { const t = k.rows.filter(r => r.r && typeof r.r === 'object' && !r.r.err); L.push(`| ${k.tag} | ${k.rows.length} | ${k.rows.filter(r => r.aktiv).length} | ${t.length} | ${t.filter(r => r.r.ok === 0).length} | ${t.filter(r => r.r.ok > 0 && r.r.ok < 3).length} | ${md(short((k.fehler || '') + ' ' + (k.log || []).join(' · ') + (k.st ? ' kap=' + k.st.kap + ' Aufgabe: ' + (k.st.obj || '') : ''), 160))} |`); }
  L.push('', '## Findet-Liste (Erreichbarkeit)', '', '| Kap. | Label | Lage | Größe | aktiv | Befund | Quelle |', '|---|---|---|---|---|---|---|');
  for (const r of [...bad, ...warn]) L.push(`| ${r.kap} | ${md(short(r.label, 50))} | ${r.pos.join(', ')} | ${r.size.join('×')} | ${r.aktiv ? 'ja' : 'nein'} | ${md(befund(r))} | ${findSrc(r.act) || findSrc(r.lf)} |`);
  for (const k of run) { L.push('', `## Laufzeit-Inventar ${k.tag} (${k.rows.length})`, '', '| Label | Lage x,y,z | Größe | aktiv/sichtbar | Bedingung | Wirkung (Aktion) | Quelle | Standpunkte ok/gefunden (stehend/hockend) | Befund |', '|---|---|---|---|---|---|---|---|---|');
    for (const r of [...k.rows].sort((a, b) => a.pos[0] - b.pos[0])) { const R = r.r && typeof r.r === 'object' ? r.r : null;
      L.push(`| ${md(short(r.label, 50))} | ${r.pos.join(', ')} | ${r.size.join('×')} | ${r.aktiv}/${r.sichtbar} | ${md(cond(r))} | ${md(short(r.act, 120))} | ${findSrc(r.act) || findSrc(r.lf)} | ${R ? (R.err ? 'Fehler' : `${R.ok}/${R.n} (${R.okStand}/${R.okCrouch})`) : (r.r || '–')} | ${md(befund(r))} |`); } }
}
L.push('', `## Statische Fundstellen: Klickflächen (${stat.length})`, '', 'Wrapper: `interact` (Basis), `kirchberg_hit`/`villa_hit`/`kf_hit`/`amt_hit`/`spot` (verborgene Klickkiste), `neben3_ort` (nur aktiv, solange `wann()` wahr), Türen (`makeDoor`/`steelDoor`/`amt_tuer`), `anwesen_wrap`, `ausruestung_spot`, `tausch_glint`, `katzen_klick`, `n5_huelle` (Bedingung `wenn`).', '',
  '| Datei:Zeile | nahe Funktion | Art | Label | x / y / z (Argumente) | Bedingung (wann) | Aktion |', '|---|---|---|---|---|---|---|');
for (const s of stat) L.push(`| ${s.f}:${s.ln} | ${s.fn} | ${s.w} | ${md(short(s.label, 60))} | ${md(s.lagen.join(' / '))} | ${md(s.wann)} | ${md(short(s.act, 100))} |`);
const byK = {}; for (const i of items) (byK[i.k] = byK[i.k] || []).push(i);
L.push('', `## Statische Fundstellen: Sammel-Quellen (${items.length})`, '');
for (const [k, list] of Object.entries(byK)) { L.push(`### ${k} (${list.length})`, '', '| Datei:Zeile | nahe Funktion | Schlüssel | weitere Argumente |', '|---|---|---|---|');
  for (const i of list) L.push(`| ${i.f}:${i.ln} | ${i.fn} | ${md(short(i.key, 50))} | ${md(i.rest)} |`); L.push(''); }
L.push(`### BEUTEL_FUNDE (beutel.js): ${beutel.length} Einträge`, '');
fs.writeFileSync(DOC, L.join('\n') + '\n');
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ stat, items, run }, null, 1));
console.log('statisch: ' + stat.length + ' Klickflächen, ' + items.length + ' Sammel-Aufrufe, Beutel ' + beutel.length + (run ? ' · Laufzeit: ' + run.map(k => k.tag + '=' + k.rows.length).join(' ') : '') + ' → ' + DOC);
