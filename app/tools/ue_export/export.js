#!/usr/bin/env node
// =====================================================================  UE-EXPORT (statische Analyse, ohne Spiel)
// Liest app/mods/*.js und app/mods/_base_source_index.html als TEXT (nichts wird ausgeführt außer harmlosen Daten-Literalen in einer vm-Sandbox)
// und schreibt strukturierte JSONs nach docs/unreal/data/ – Grundlage für Unreal-DataTables (Import: import_datatables.py).
//
// Aufruf:   node app/tools/ue_export/export.js            (aus dem Repo-Wurzelverzeichnis oder von überall)
// Optionen: --stimmen <pfad>  Ordner HAM_Stimmen (Standard: ../HAM_Stimmen neben dem Repo oder %USERPROFILE%\HAM_Stimmen)
//
// Ausgabe (docs/unreal/data/):
//   dialoge.json  dialoge.csv   Untertitel-/Sprechzeilen (Sprecher, Text, Datei, Zeile, Funktion, Beat, Echo, Kapitel-Vermutung)
//   aufgaben.json               Aufgabenzeilen (MAIN, C2_MAIN, setC3, k5_task, k6_obj, …) + Nebenaufgaben (story.side)
//   gedanken.json               Gedanken (gedanke(), LUKE_ATEM, GEDANKEN_*), Hinweis-Fäden (GEDANKEN_FADEN, ZIELE_WARUM)
//   items.json                  Gegenstände (ITEMS, modItem, *_ITEMS) mit Name, Beschreibung, Icon, Definition, Vergabe-Stellen
//   raetsel.json                Rätsel/Hürden aus docs/gameplay/qa_raetsel_k*.md + qa_items.md (Tabellen und Befunde)
//   orte.json                   Orte/Räume/Koordinaten (benannte Konstanten, Häuser, Echo-Orte, Kartenblätter)
//   figuren.json                Figuren (chars.json, cast.json, Stimmen-Besetzung, Echo-Besetzung, Sprecher-Zuordnung)
//   kapitel.json                Kapitelstruktur: Module je Kapitel, Beats, Kopfkommentare, Story-Gliederung
//   audio.json                  Audio-Inventar (klang_inventar.md) + Dateiliste game/audio
//   credits.json                CREDITS.md als Tabelle (Werk, Urheber, Verwendung, Link, Lizenz-Abschnitt)
//   assets.json                 Dateiinventar game/assets (Ordner, Dateien nach Typ, Größen)
//   _manifest.json              Zahlen und Fehlschläge
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = path.resolve(__dirname, '..', '..', '..');
const MODS = path.join(REPO, 'app', 'mods');
const OUT = path.join(REPO, 'docs', 'unreal', 'data');
const argv = process.argv.slice(2);
const argOf = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const STIMMEN = [argOf('--stimmen'), path.join(REPO, '..', 'HAM_Stimmen'), path.join(process.env.USERPROFILE || '', 'HAM_Stimmen')].filter(Boolean).find(p => fs.existsSync(p));
fs.mkdirSync(OUT, { recursive: true });
const MAN = { erzeugt: new Date().toISOString(), fehler: [], zahlen: {} };
const rel = p => path.relative(REPO, p).replace(/\\/g, '/');
const read = p => fs.readFileSync(p, 'utf8');
const write = (name, data) => { fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 1), 'utf8'); };
const warn = (w, e) => MAN.fehler.push(w + ': ' + (e && e.message || e));

// ---------------------------------------------------------------- Tokenizer (Strings, Templates, Kommentare, Regex, Klammern)
function tokenize(src, lineOffset = 0) {
  const T = [], n = src.length, stack = []; let i = 0, line = 1 + lineOffset, last = null;
  const REGPRE = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^']);
  const ESC = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };
  const push = (t, v, s, e) => { const k = { t, v, s, e, l: line, p: stack.length ? stack[stack.length - 1] : -1, m: -1 }; T.push(k); last = k;
    if (t === 'p') { if ('([{'.includes(v)) stack.push(T.length - 1); else if (')]}'.includes(v)) { const o = stack.pop(); if (o !== undefined) { T[o].m = T.length - 1; k.m = o; k.p = T[o].p; } } } };
  function str(q) { let j = i + 1, v = ''; while (j < n && src[j] !== q) { if (src[j] === '\\') { const c = src[j + 1]; if (c === 'u') { v += String.fromCharCode(parseInt(src.substr(j + 2, 4), 16)); j += 6; continue; } if (c === 'x') { v += String.fromCharCode(parseInt(src.substr(j + 2, 2), 16)); j += 4; continue; } if (c === '\n') { line++; j += 2; continue; } v += ESC[c] !== undefined ? ESC[c] : c; j += 2; continue; } if (src[j] === '\n') break; v += src[j++]; } return [v, j + 1]; }
  function tpl(j0) { // j0 steht auf dem öffnenden Backtick; Rückgabe [text mit {…}-Platzhaltern, Ende]
    let j = j0 + 1, v = '', nl = 0;
    while (j < n && src[j] !== '`') {
      if (src[j] === '\\') { const c = src[j + 1]; v += ESC[c] !== undefined ? ESC[c] : c; j += 2; continue; }
      if (src[j] === '$' && src[j + 1] === '{') { let d = 1; j += 2; while (j < n && d > 0) { const c = src[j]; if (c === '{') d++; else if (c === '}') d--; else if (c === '`') { j = tpl(j)[1] - 1; } else if (c === '"' || c === "'") { let k = j + 1; while (k < n && src[k] !== c && src[k] !== '\n') { if (src[k] === '\\') k++; k++; } j = k; } else if (c === '\n') nl++; j++; } v += '{…}'; continue; }
      if (src[j] === '\n') nl++; v += src[j++];
    }
    line += nl; return [v, j + 1];
  }
  while (i < n) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); const end = e < 0 ? n : e + 2; for (let k = i; k < end; k++) if (src[k] === '\n') line++; i = end; continue; }
    if (c === '"' || c === "'") { const s = i; const [v, e] = str(c); push('str', v, s, e); i = e; continue; }
    if (c === '`') { const s = i, l0 = line; const [v, e] = tpl(i); push('str', v, s, e); T[T.length - 1].l = l0; T[T.length - 1].tpl = true; i = e; continue; }
    if (c === '/') { const prevOK = !last || (last.t === 'p' && REGPRE.has(last.v)) || (last.t === 'id' && /^(return|typeof|case|in|of|delete|void)$/.test(last.v));
      if (prevOK) { let j = i + 1, cls = false; while (j < n && src[j] !== '\n') { if (src[j] === '\\') { j += 2; continue; } if (src[j] === '[') cls = true; else if (src[j] === ']') cls = false; else if (src[j] === '/' && !cls) break; j++; } if (src[j] === '/') { j++; while (/[a-z]/i.test(src[j] || '')) j++; push('re', src.slice(i, j), i, j); i = j; continue; } } }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) { const m = /^(0[xX][0-9a-fA-F_]+|[0-9][0-9_]*\.?[0-9_]*(?:[eE][+-]?[0-9]+)?|\.[0-9]+(?:[eE][+-]?[0-9]+)?)n?/.exec(src.slice(i, i + 40)); const v = m[0]; push('num', v, i, i + v.length); i += v.length; continue; }
    const m = /^[\p{L}_$][\p{L}\p{N}_$]*/u.exec(src.slice(i, i + 80)); if (m) { push('id', m[0], i, i + m[0].length); i += m[0].length; continue; }
    push('p', c, i, i + 1); i++;
  }
  return T;
}

// ---------------------------------------------------------------- Dateien laden
function loadSource(file) {
  const raw = read(file);
  if (!file.endsWith('.html')) return { raw, code: raw, toks: tokenize(raw) };
  // nur <script>-Inhalte (ohne src) – Zeichenpositionen bleiben über Auffüllung erhalten, damit raw.slice(s,e) stimmt
  let code = raw.replace(/[^\n]/g, ' ').split(''); const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m;
  while ((m = re.exec(raw))) { if (/\bsrc=/.test(m[1])) continue; const st = m.index + m[0].indexOf('>') + 1; for (let k = 0; k < m[2].length; k++) code[st + k] = raw[st + k]; }
  code = code.join('');
  return { raw, code, toks: tokenize(code) };
}
const FILES = fs.readdirSync(MODS).filter(f => f.endsWith('.js') || f === '_base_source_index.html').sort();
const SRC = {}; // name -> {raw, code, toks, name}
for (const f of FILES) { try { const s = loadSource(path.join(MODS, f)); s.name = f.replace(/\.js$/, ''); s.file = 'app/mods/' + f; SRC[f] = s; } catch (e) { warn('laden ' + f, e); } }
const BASE = SRC['_base_source_index.html'];
const ALLSRC = Object.values(SRC);

// ---------------------------------------------------------------- Hilfen
const cleanTags = t => String(t).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const SPEAKER = /^[A-ZÄÖÜ][A-ZÄÖÜ0-9 .,·()?'’+\-–:\/…]{1,44}$/;
function args(toks, iOpen) { // Argumentbereiche [a,b) einer Klammer (Token-Indizes), Top-Level-Kommas
  const close = toks[iOpen].m; if (close < 0) return []; const out = []; let a = iOpen + 1, j = a;
  while (j < close) { const k = toks[j]; if (k.t === 'p' && k.v === ',') { out.push([a, j]); a = j + 1; j++; continue; } if (k.t === 'p' && '([{'.includes(k.v) && k.m > 0) { j = k.m + 1; continue; } j++; }
  if (a < close || out.length) out.push([a, close]); return out;
}
function exprText(toks, a, b) { // String-Ausdruck → Text mit {…} für Dynamisches; Rückgabe {text, varianten?}
  const topQ = []; for (let j = a; j < b; j++) { const k = toks[j]; if (k.t === 'p' && '([{'.includes(k.v) && k.m > 0) { j = k.m; continue; } if (k.t === 'p' && k.v === '?') topQ.push(j); }
  if (topQ.length) { const q = topQ[0]; let col = -1; for (let j = q + 1; j < b; j++) { const k = toks[j]; if (k.t === 'p' && '([{'.includes(k.v) && k.m > 0) { j = k.m; continue; } if (k.t === 'p' && k.v === ':') { col = j; break; } }
    if (col > 0) { const A = exprText(toks, q + 1, col), B = exprText(toks, col + 1, b); const v = [A.text, B.text].filter(Boolean); return { text: v[0] || '', varianten: v.length > 1 ? v : undefined, dyn: true }; } }
  let text = '', dyn = false, ph = false;
  for (let j = a; j < b; j++) { const k = toks[j];
    if (k.t === 'str') { text += k.v; ph = false; if (k.tpl && /\{…\}/.test(k.v)) dyn = true; }
    else if (k.t === 'p' && k.v === '+') continue;
    else if (k.t === 'p' && k.v === '(' && toks[j - 1] && toks[j - 1].t !== 'id' && k.m > 0) { const r = exprText(toks, j + 1, k.m); text += r.text; dyn = dyn || r.dyn; j = k.m; }
    else { if (!ph) text += '{…}'; ph = true; dyn = true; if (k.t === 'p' && '([{'.includes(k.v) && k.m > 0) j = k.m; } }
  return { text, dyn };
}
const single = (toks, a, b) => b - a === 1 ? toks[a] : null;
function funcAt(toks, i) { for (let j = i; j >= 0 && j > i - 4000; j--) { const k = toks[j]; if (k.t === 'id' && k.v === 'function' && toks[j + 1] && toks[j + 1].t === 'id') return toks[j + 1].v; if (k.t === 'id' && toks[j + 1] && toks[j + 1].v === '=' && toks[j + 2] && (toks[j + 2].v === 'async' || toks[j + 2].v === '(' ) && /^(const|let|var)$/.test(toks[j - 1] ? toks[j - 1].v : '') && toks[j - 1] && toks[j - 1].p === toks[i].p) return k.v; } return ''; }
function lineOf(toks, i) { return toks[i].l; }

// Datei → Kapitel-Vermutung (Modul-Ebene; nur Hinweis)
const FILE_KAP = { kapitel1: [1], zimmer7: [1, 2], amt: [2], akte: [2], uebergang: [1, 2], kapitel3: [3], justin: [3], weiss: [3], neben3: [3], lucy3: [3], innen_kapitel: [2, 3], anwesen: [4], villa: [4], kapitel5: [5], neben5: [5], kapitel6: [6], wald: [6], tiefwald: [6], hungrige: [6], neben6: [6], neben4: [4], nr4: [4], ausbau_nord: [5, 6], post: [5], kirchberg: [5], traum: [3, 5, 6], kiffen: [1, 4], '_base_source_index.html': [1, 2] };

// ---------------------------------------------------------------- Sprecher-Aliase und Sprech-Wrapper je Datei
function analyseFile(S) {
  const toks = S.toks; S.alias = {}; S.wrap = {};
  for (let i = 0; i < toks.length - 3; i++) {
    const k = toks[i];
    if (k.t === 'id' && /^(const|let|var)$/.test(k.v) && toks[i + 1].t === 'id' && toks[i + 2].v === '=' && toks[i + 3].t === 'str' && SPEAKER.test(toks[i + 3].v)) S.alias[toks[i + 1].v] = toks[i + 3].v;
  }
  // Wrapper: NAME = ( … ) => … subtitle( / say( …   oder function NAME(…){ … subtitle( … }
  for (let i = 0; i < toks.length - 3; i++) {
    const k = toks[i]; let name = null, bodyA = 0, bodyB = 0;
    if (k.t === 'id' && k.v === 'function' && toks[i + 1].t === 'id' && toks[i + 2].v === '(') { name = toks[i + 1].v; const cl = toks[i + 2].m; if (cl > 0 && toks[cl + 1] && toks[cl + 1].v === '{') { bodyA = cl + 1; bodyB = toks[cl + 1].m; } }
    else if ((k.t === 'id' && /^(const|let|var)$/.test(k.v) && toks[i + 1].t === 'id' && toks[i + 2].v === '=') || (k.t === 'p' && k.v === ',' && toks[i + 1].t === 'id' && toks[i + 2].v === '=' && toks[i + 3].v !== '=')) { name = toks[i + 1].v; let j = i + 3; if (toks[j].v === 'async') j++; if (toks[j].v === '(' && toks[j].m > 0 && toks[toks[j].m + 1] && toks[toks[j].m + 1].v === '=') { bodyA = toks[j].m + 3; bodyB = Math.min(toks.length, bodyA + 80); if (toks[bodyA] && toks[bodyA].v === '{' && toks[bodyA].m > 0) bodyB = toks[bodyA].m; } else if (toks[j].t === 'id' && toks[j + 1] && toks[j + 1].v === '=' && toks[j + 2] && toks[j + 2].v === '>') { bodyA = j + 3; bodyB = Math.min(toks.length, bodyA + 80); } }
    if (!name || bodyB <= bodyA) continue;
    let uses = false; const sp = new Set();
    for (let j = bodyA; j < Math.min(bodyB, bodyA + 400); j++) { const t = toks[j]; if (t.t === 'id' && (t.v === 'subtitle' || t.v === 'say') && toks[j + 1] && toks[j + 1].v === '(') uses = true; if (t.t === 'str' && SPEAKER.test(t.v) && t.v.length > 2) sp.add(t.v); else if (t.t === 'id' && S.alias[t.v]) sp.add(S.alias[t.v]); }
    if (uses && !S.wrap[name]) S.wrap[name] = sp.size === 1 ? [...sp][0] : '';
  }
}
ALLSRC.forEach(S => { try { analyseFile(S); } catch (e) { warn('analyse ' + S.file, e); } });

// ---------------------------------------------------------------- Echo-Bereiche und Beats je Datei
function echoRanges(S) { const r = []; const t = S.toks; for (let i = 0; i < t.length - 3; i++) if (t[i].t === 'id' && t[i].v === 'id' && t[i + 1].v === ':' && t[i + 2].t === 'str' && /^echo_/.test(t[i + 2].v) && t[i].p >= 0) r.push({ id: t[i + 2].v, a: t[i].p, b: t[t[i].p].m, i }); return r; }
function beatAt(S, i) { const t = S.toks; for (let j = i; j >= 0 && j > i - 1500; j--) { const k = t[j]; if (k.t === 'id' && /^(k5_set|k6_set|k5_ab|k5_vor|k6_ab|k6_vor)$/.test(k.v) && t[j + 1].v === '(' && t[j + 2].t === 'str') return t[j + 2].v; if (k.t === 'id' && /^(beat|bt)$/.test(k.v) && /^[=!]$/.test(t[j + 1].v) && t[j + 2] && t[j + 2].t === 'p' && t[j + 3] && t[j + 3].t === 'str') return t[j + 3].v; if (k.t === 'id' && k.v === 'case' && t[j + 1].t === 'str') return t[j + 1].v; } return ''; }

// ---------------------------------------------------------------- 1) Dialoge
const wer = (() => { try { return JSON.parse(read(path.join(REPO, 'game', 'assets', 'stimmen', 'manifest.json'))).wer || {}; } catch (e) { return {}; } })();
const dialoge = []; const seenPos = new Set();
function addLine(S, i, o) {
  const key = S.name + ':' + i; if (seenPos.has(key)) return; seenPos.add(key);
  const text = cleanTags(o.text || ''); if (text.replace(/\{…\}/g, '').trim().length < 2) return;
  const E = S.echoR.find(e => i > e.a && i < e.b);
  dialoge.push({ Name: '', sprecher: o.who || '', sprecherId: wer[o.who] || '', text, textRoh: o.text !== text ? o.text : undefined, dauerMs: o.ms, dynamisch: o.dyn || undefined, varianten: o.varianten && o.varianten.map(cleanTags), art: o.art,
    datei: S.file, zeile: S.toks[i].l, funktion: funcAt(S.toks, i), beat: beatAt(S, i) || undefined, echo: E ? E.id : undefined, kapitelModul: FILE_KAP[S.name] });
}
for (const S of ALLSRC) {
  S.echoR = echoRanges(S); const t = S.toks;
  for (let i = 0; i < t.length; i++) {
    const k = t[i];
    // a) f(text, ms, 'WER') – beliebiger Aufrufname; subtitle ohne Sprecher = Erzählung
    if (k.t === 'id' && t[i + 1] && t[i + 1].v === '(' && t[i + 1].m > 0 && (!t[i - 1] || t[i - 1].v !== 'function')) {
      const isSub = k.v === 'subtitle', wrapSp = S.wrap[k.v];
      if (isSub || wrapSp !== undefined || k.v === 'say' || k.v === 'say2') {
        const A = args(t, i + 1);
        if (isSub || (wrapSp !== undefined && A.length && k.v !== 'say')) { if (A.length) { const e0 = exprText(t, A[0][0], A[0][1]); if (e0.text) { let who = ''; if (isSub && A[2]) { const s = single(t, A[2][0], A[2][1]); who = s ? (s.t === 'str' ? s.v : (S.alias[s.v] || '')) : ''; } else if (!isSub) { who = wrapSp || ''; if (A[2]) { const s = single(t, A[2][0], A[2][1]); if (s && s.t === 'str') who = s.v; } }
          const ms = A[1] && single(t, A[1][0], A[1][1]) && t[A[1][0]].t === 'num' ? +t[A[1][0]].v : undefined;
          if (!(wrapSp !== undefined && !isSub && e0.text.length < 4)) addLine(S, i, { text: e0.text, who, ms, dyn: e0.dyn, varianten: e0.varianten, art: isSub ? 'subtitle' : 'wrapper:' + k.v }); } } }
      }
      // b) generisch f('text', ms, 'SPRECHER')
      else { const A = args(t, i + 1); if (A.length >= 3) { const s = single(t, A[2][0], A[2][1]); if (s && s.t === 'str' && SPEAKER.test(s.v) && s.v.length > 2 && /[A-ZÄÖÜ]{3}/.test(s.v) && A[1] && t[A[1][0]].t === 'num' && b1(t, A[0])) { const e0 = exprText(t, A[0][0], A[0][1]); addLine(S, i, { text: e0.text, who: s.v, ms: +t[A[1][0]].v, dyn: e0.dyn, art: 'aufruf:' + k.v }); } } }
    }
    // c) Tupel [text, ms, who] / [text, who, t] / [text, ms] innerhalb eines Sprech-Aufrufs
    if (k.t === 'p' && k.v === '[' && k.m > 0) {
      const A = args(t, i); if (A.length < 2 || A.length > 5) continue; const e0 = exprText(t, A[0][0], A[0][1]); if (!/[\p{L}]{2}/u.test(e0.text) || !b1(t, A[0])) continue;
      let who = '', ms; for (let q = 1; q < A.length; q++) { const s = single(t, A[q][0], A[q][1]); if (!s) continue; if (s.t === 'str' && SPEAKER.test(s.v) && s.v.length > 2 && /[A-ZÄÖÜ]{3}/.test(s.v)) who = s.v; else if (s.t === 'id' && S.alias[s.v]) who = S.alias[s.v]; else if (s.t === 'num' && ms === undefined) ms = +s.v; }
      let ok = !!who && (e0.text.length > 2 && !/^[A-Z]-?\d+$/.test(e0.text));
      if (!ok && A.length >= 2) { const s1 = single(t, A[1][0], A[1][1]); if (s1 && s1.t === 'num') { const outer = t[k.p]; if (outer && outer.v === '[' && t[outer.p] && t[outer.p].v === '(' && t[outer.p - 1] && t[outer.p - 1].t === 'id' && (S.wrap[t[outer.p - 1].v] !== undefined || /^(say|sag|says|k5_sag|villa_says|k6_luke|k5_denk)$/.test(t[outer.p - 1].v))) { ok = true; who = S.wrap[t[outer.p - 1].v] || ''; } } }
      if (ok) addLine(S, i, { text: e0.text, who, ms, dyn: e0.dyn, art: 'tupel' });
    }
  }
}
function b1(t, r) { return r[1] - r[0] >= 1 && (t[r[0]].t === 'str' || (t[r[0]].t === 'p' && t[r[0]].v === '(') || t[r[0]].t === 'id'); }
// Ids vergeben, stabil nach Datei/Zeile
dialoge.sort((a, b) => a.datei.localeCompare(b.datei) || a.zeile - b.zeile);
const cnt = {}; for (const d of dialoge) { const base = path.basename(d.datei, '.js').replace(/[^A-Za-z0-9_]/g, '_').replace(/^_+/, 'base_'); cnt[base] = (cnt[base] || 0) + 1; d.Name = `DLG_${base}_${String(cnt[base]).padStart(4, '0')}`; }
write('dialoge.json', dialoge);
fs.writeFileSync(path.join(OUT, 'dialoge.csv'), ['Name,Sprecher,SprecherId,Text,DauerMs,Datei,Zeile,Funktion,Beat,Echo']
  .concat(dialoge.map(d => [d.Name, d.sprecher, d.sprecherId, d.text, d.dauerMs ?? '', d.datei, d.zeile, d.funktion, d.beat || '', d.echo || ''].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','))).join('\n'), 'utf8');
MAN.zahlen.dialoge = { zeilen: dialoge.length, mitSprecher: dialoge.filter(d => d.sprecher).length, ohneSprecher_erzaehlung: dialoge.filter(d => !d.sprecher).length, sprecher: [...new Set(dialoge.map(d => d.sprecher).filter(Boolean))].length, dateien: new Set(dialoge.map(d => d.datei)).size };

// ---------------------------------------------------------------- Konstanten auswerten (Daten-Literale in vm)
const CTX = vm.createContext({ PI: Math.PI, Math, Infinity, NaN, undefined: undefined });
function constInit(S, name) { const t = S.toks; for (let i = 0; i < t.length - 3; i++) if (t[i].t === 'id' && /^(const|let|var)$/.test(t[i].v) && t[i + 1].v === name && t[i + 2].v === '=') { const j = i + 3; if (t[j].t === 'p' && '[{'.includes(t[j].v) && t[j].m > 0) return { i, a: j, b: t[j].m, src: S.code.slice(t[j].s, t[t[j].m].e), line: t[i].l }; } return null; }
function evalLit(src, tries = 40) {
  const code = 'globalThis.__r = ' + src; // an den Kontext gebunden
  for (let n = 0; n < tries; n++) { try { vm.runInContext(code, CTX, { timeout: 500 }); const r = CTX.__r; return JSON.parse(JSON.stringify(r, (k, v) => typeof v === 'function' ? undefined : v)); } catch (e) { const m = /^(\w+) is not defined/.exec(e.message); if (m && !(m[1] in CTX)) { CTX[m[1]] = 0; continue; } throw e; } }
  throw new Error('zu viele Rückfalle');
}
const evaled = {}; // name -> Wert
function evalConst(S, name) { const c = constInit(S, name); if (!c) return null; try { const v = evalLit(c.src); evaled[name] = v; CTX[name] = JSON.parse(JSON.stringify(v)); return { wert: v, datei: S.file, zeile: c.line }; } catch (e) { warn('Konstante ' + name + ' (' + S.file + ')', e); return null; } }
// Reihenfolge: Basis-Ursprünge zuerst
const ORIGINS = ['C2', 'C3', 'C4', 'K5_Y'];
for (const nm of ORIGINS) { for (const S of ALLSRC) { const r = evalConst(S, nm); if (r) break; } }
if (!('K5_Y' in evaled)) CTX.K5_Y = 0.43;

// ---------------------------------------------------------------- 2) Aufgaben
const aufgaben = [];
function addTask(S, i, text, art, extra = {}) { const tx = cleanTags(text); if (tx.replace(/\{…\}/g, '').length < 5) return; aufgaben.push(Object.assign({ Name: '', text: tx, art, datei: S.file, zeile: S.toks[i].l, funktion: funcAt(S.toks, i), kapitelModul: FILE_KAP[S.name] }, extra)); }
const TASKFN = /^(setC3|k5_task|k6_obj|k5_obj|setC2Objective|villa_ziel|pz_ziel|kamera_ziel|st_ziel|blick_ziel|setMain)$/;
for (const S of ALLSRC) {
  const t = S.toks;
  for (let i = 0; i < t.length; i++) {
    const k = t[i];
    if (k.t === 'id' && TASKFN.test(k.v) && t[i + 1] && t[i + 1].v === '(' && t[i - 1] && t[i - 1].v !== 'function') { const A = args(t, i + 1); if (!A.length) continue; if (k.v === 'setMain') { const n0 = single(t, A[0][0], A[0][1]); if (n0 && n0.t === 'num') aufgaben.push({ Name: '', art: 'setMain', mainIndex: +n0.v, datei: S.file, zeile: k.l, text: 'MAIN[' + n0.v + ']' }); continue; }
      const e0 = exprText(t, A[0][0], A[0][1]); if (e0.text) addTask(S, i, e0.text, k.v, { dynamisch: e0.dyn || undefined, varianten: e0.varianten, beat: beatAt(S, i) || undefined }); }
    if (k.t === 'id' && /^(sideStart|sideDone)$/.test(k.v) && t[i + 1] && t[i + 1].v === '(') { const A = args(t, i + 1); const id = A[0] && single(t, A[0][0], A[0][1]); if (id && id.t === 'str') { const d = A[1] ? exprText(t, A[1][0], A[1][1]).text : ''; aufgaben.push({ Name: '', art: k.v, nebenaufgabe: id.v, text: cleanTags(d), datei: S.file, zeile: k.l, funktion: funcAt(t, i), kapitelModul: FILE_KAP[S.name] }); } }
  }
}
// Konstante Aufgabenlisten
const TASKARR = {};
for (const S of ALLSRC) { const t = S.toks; for (let i = 0; i < t.length - 3; i++) if (t[i].t === 'id' && /^(const|let|var)$/.test(t[i].v) && /^(MAIN|C2_MAIN|[A-Z0-9_]*(ZIEL|MAIN|AUFGABE)[A-Z0-9_]*)$/.test(t[i + 1].v) && t[i + 2].v === '=' && t[i + 3].v === '[') { const A = args(t, i + 3); A.forEach((r, n) => { const e = exprText(t, r[0], r[1]); if (e.text && !/^\{…\}$/.test(e.text)) aufgaben.push({ Name: '', art: 'liste:' + t[i + 1].v, index: n, text: cleanTags(e.text), datei: S.file, zeile: t[i].l, kapitelModul: FILE_KAP[S.name] }); }); } else if (t[i].t === 'id' && /^(const|let|var)$/.test(t[i].v) && /^(KAPITEL\d?_ZIEL[A-Z_]*|[A-Z0-9_]*ZIEL[A-Z0-9_]*)$/.test(t[i + 1].v) && t[i + 2].v === '=' && t[i + 3].t === 'str') aufgaben.push({ Name: '', art: 'konstante:' + t[i + 1].v, text: cleanTags(t[i + 3].v), datei: S.file, zeile: t[i].l, kapitelModul: FILE_KAP[S.name] }); }
// Nebenaufgaben-Definitionen: story.side = { … } und story.side.xxx = {title, desc}
const nebenDef = [];
for (const S of ALLSRC) { const t = S.toks;
  for (let i = 0; i < t.length - 6; i++) {
    if (t[i].v === 'side' && t[i + 1].v === ':' && t[i + 2].v === '{' && t[i + 2].m > 0 && /title\s*:/.test(S.code.slice(t[i + 2].s, t[t[i + 2].m].e))) { try { const o = evalLit(S.code.slice(t[i + 2].s, t[t[i + 2].m].e)); for (const [id, q] of Object.entries(o)) nebenDef.push({ Name: 'SIDE_' + id, id, titel: q.title, beschreibung: q.desc, start: q.state, datei: S.file, zeile: t[i].l }); } catch (e) { warn('story.side', e); } }
    if (t[i].v === 'story' && t[i + 1].v === '.' && t[i + 2].v === 'side' && (t[i + 3].v === '.' || t[i + 3].v === '[') && t[i - 1].v !== '.') { let id, j = i + 4; if (t[i + 3].v === '.') id = t[j].v; else if (t[j].t === 'str') id = t[j].v; if (id && t[i + 3].v === '.' && t[j + 1].v === '=' && t[j + 2].v === '{' && t[j + 2].m > 0) { const raw = S.code.slice(t[j + 2].s, t[t[j + 2].m].e); try { const o = evalLit(raw); nebenDef.push({ Name: 'SIDE_' + id, id, titel: o.title, beschreibung: o.desc, start: o.state, datei: S.file, zeile: t[i].l }); } catch (e) { const m1 = /title\s*:\s*(['"`])(.*?)\1/.exec(raw), m2 = /desc\s*:\s*(['"`])(.*?)\1/.exec(raw); if (m1) nebenDef.push({ Name: 'SIDE_' + id, id, titel: m1[2], beschreibung: m2 ? m2[2] : '', datei: S.file, zeile: t[i].l, hinweis: 'teilweise dynamisch' }); } } } } }
// weitere Nebenaufgaben-Kataloge: Objekte mit { title:…, desc:… } in Konstanten *_SIDE / sideQuests (Tabellen)
{ const seen = new Set(nebenDef.map(n => n.id)); for (const S of ALLSRC) { const t = S.toks; for (let i = 1; i < t.length - 6; i++) { if (t[i].t === 'id' && t[i + 1].v === ':' && t[i + 2].v === '{' && t[i + 2].m > 0 && t[i + 3].v === 'title' && t[i + 4].v === ':' && t[i + 5].t === 'str' && !seen.has(t[i].v + S.name)) { const raw = S.code.slice(t[i + 2].s, t[t[i + 2].m].e); const m2 = /desc\s*:\s*(['"`])((?:\\.|(?!\1).)*)\1/.exec(raw); nebenDef.push({ Name: 'SIDE_' + t[i].v, id: t[i].v, titel: t[i + 5].v, beschreibung: m2 ? m2[2] : '', datei: S.file, zeile: t[i].l }); seen.add(t[i].v + S.name); } } } }
const nebenUniq = []; { const s = new Set(); for (const n of nebenDef) { const k = n.id + '|' + n.titel; if (!s.has(k)) { s.add(k); nebenUniq.push(n); } } }
aufgaben.sort((a, b) => a.datei.localeCompare(b.datei) || (a.zeile || 0) - (b.zeile || 0));
const tc = {}; for (const a of aufgaben) { const b = path.basename(a.datei, '.js').replace(/^_+/, 'base_').replace(/[^A-Za-z0-9_]/g, '_'); tc[b] = (tc[b] || 0) + 1; a.Name = `TASK_${b}_${String(tc[b]).padStart(3, '0')}`; }
write('aufgaben.json', { aufgaben, nebenaufgaben: nebenUniq });
MAN.zahlen.aufgaben = { aufgabenzeilen: aufgaben.length, nebenaufgaben: nebenUniq.length, mainListen: aufgaben.filter(a => /^liste:(MAIN|C2_MAIN)$/.test(a.art)).length };

// ---------------------------------------------------------------- 3) Gedanken und Hinweis-Fäden
const gedanken = [];
const gdFile = SRC['gedanken.js'];
for (const S of ALLSRC) { const t = S.toks;
  for (let i = 0; i < t.length; i++) {
    const k = t[i];
    if (k.t === 'id' && /^(gedanke|k5_denk|k6_luke)$/.test(k.v) && t[i + 1] && t[i + 1].v === '(' && t[i - 1] && t[i - 1].v !== 'function') { const A = args(t, i + 1); if (k.v === 'gedanke' && A.length >= 2) { const id = single(t, A[0][0], A[0][1]); const e = exprText(t, A[1][0], A[1][1]); if (e.text) gedanken.push({ Name: '', art: 'gedanke', gedankeId: id && id.t === 'str' ? id.v : '(dynamisch)', text: cleanTags(e.text), datei: S.file, zeile: k.l, funktion: funcAt(t, i), kapitelModul: FILE_KAP[S.name] }); } }
    // Tabellen: [id, text] / [id, anlass, text] mit id wie 'A-01', 'k1_lucy1'
    if (k.t === 'p' && k.v === '[' && k.m > 0 && (S === gdFile || /GEDANKEN|ATEM|LUKE_/.test(S.code.slice(Math.max(0, k.s - 160), k.s)))) { const A = args(t, i); if (A.length >= 2 && A.length <= 3) { const a0 = single(t, A[0][0], A[0][1]); if (a0 && a0.t === 'str' && /^[A-Za-z][A-Za-z0-9_\-]{1,22}$/.test(a0.v) && !/\s/.test(a0.v)) { const last = exprText(t, A[A.length - 1][0], A[A.length - 1][1]); if (last.text.length >= 12 && / /.test(last.text)) gedanken.push({ Name: '', art: 'tabelle', gedankeId: a0.v, anlass: A.length === 3 ? (single(t, A[1][0], A[1][1]) || {}).v : undefined, text: cleanTags(last.text), datei: S.file, zeile: k.l, funktion: funcAt(t, i), kapitelModul: FILE_KAP[S.name] }); } } }
    // Fäden: [/regex/, 'Text'] (GEDANKEN_FADEN) und ZIELE_WARUM
    if (k.t === 'p' && k.v === '[' && k.m > 0 && t[i + 1] && t[i + 1].t === 're' && t[i + 2] && t[i + 2].v === ',') { const A = args(t, i); if (A.length === 2) { const e = exprText(t, A[1][0], A[1][1]); const typ = /ZIELE_WARUM/.test(S.code.slice(Math.max(0, k.s - 6000), k.s)) && S.name === 'ziele' ? 'ziel_warum' : (/GEDANKEN_FADEN/.test(S.code.slice(Math.max(0, k.s - 6000), k.s)) ? 'faden' : 'regex_text'); if (e.text) gedanken.push({ Name: '', art: typ, trifftAufgabe: t[i + 1].v, text: cleanTags(e.text), datei: S.file, zeile: k.l, kapitelModul: FILE_KAP[S.name] }); } }
  }
}
{ const seen = new Set(); const u = []; for (const g of gedanken) { const k = g.datei + g.zeile + g.text; if (!seen.has(k)) { seen.add(k); u.push(g); } } gedanken.length = 0; gedanken.push(...u); }
const gc = {}; for (const g of gedanken) { const b = path.basename(g.datei, '.js'); gc[b] = (gc[b] || 0) + 1; g.Name = `THT_${b}_${String(gc[b]).padStart(3, '0')}`; }
write('gedanken.json', gedanken);
MAN.zahlen.gedanken = { gesamt: gedanken.length, faeden: gedanken.filter(g => g.art === 'faden').length, zielWarum: gedanken.filter(g => g.art === 'ziel_warum').length };

// ---------------------------------------------------------------- 4) Items
const items = {}; const itemsRaw = [];
function itemRec(key) { return items[key] || (items[key] = { Name: 'ITEM_' + key, key, name: '', beschreibung: '', icon: '', definiertIn: [], vergebenIn: [], dynamisch: false }); }
for (const S of ALLSRC) { const t = S.toks;
  for (let i = 0; i < t.length; i++) { const k = t[i];
    if (k.t === 'id' && k.v === 'modItem' && t[i + 1].v === '(' && t[i - 1].v !== 'function') { const A = args(t, i + 1); if (A.length >= 3) { const key = single(t, A[0][0], A[0][1]); if (key && key.t === 'str') { const r = itemRec(key.v); const nm = exprText(t, A[1][0], A[1][1]), ds = exprText(t, A[2][0], A[2][1]); r.name = r.name || cleanTags(nm.text); r.beschreibung = r.beschreibung || cleanTags(ds.text); const ic = A[3] && single(t, A[3][0], A[3][1]); if (ic && ic.t === 'str') r.icon = r.icon || ic.v; if (nm.dyn || ds.dyn) r.dynamisch = true; r.definiertIn.push({ datei: S.file, zeile: k.l, funktion: funcAt(t, i) }); } else { itemsRaw.push({ datei: S.file, zeile: k.l, hinweis: 'modItem mit dynamischem Schlüssel', quelltext: S.code.slice(k.s, Math.min(k.s + 200, t[i + 1].m > 0 ? t[t[i + 1].m].e : k.s + 200)) }); } } }
    if (k.t === 'id' && /^(addItem|gibItem|giveItem)$/.test(k.v) && t[i + 1].v === '(' && t[i - 1].v !== 'function') { const A = args(t, i + 1); const key = A[0] && single(t, A[0][0], A[0][1]); if (key && key.t === 'str') itemRec(key.v).vergebenIn.push({ datei: S.file, zeile: k.l, funktion: funcAt(t, i), beat: beatAt(S, i) || undefined }); else if (A[0]) itemsRaw.push({ datei: S.file, zeile: k.l, hinweis: 'addItem dynamisch', quelltext: S.code.slice(k.s, Math.min(k.s + 120, k.s + 120)) }); }
    // Objekte: const NAME_ITEMS = { key: {name, desc} | [name, desc] }
    if (k.t === 'id' && /^(const|let|var)$/.test(k.v) && /^[A-Z0-9_]*ITEMS$/.test(t[i + 1].v) && t[i + 2].v === '=' && t[i + 3].v === '{' && t[i + 3].m > 0) { const A = args(t, i + 3);
      for (const r of A) { const kk = t[r[0]]; if (!kk || !(kk.t === 'id' || kk.t === 'str') || t[r[0] + 1].v !== ':') continue; const key = kk.v; const v0 = r[0] + 2; const rec = itemRec(key);
        if (t[v0].v === '{' && t[v0].m > 0) { for (const f of args(t, v0)) { const fk = t[f[0]]; if (!fk) continue; if (fk.v === 'get') { rec.dynamisch = true; const fk2 = t[f[0] + 1]; continue; } if (t[f[0] + 1] && t[f[0] + 1].v === ':') { const e = exprText(t, f[0] + 2, f[1]); if (fk.v === 'name') rec.name = rec.name || cleanTags(e.text); else if (fk.v === 'desc') rec.beschreibung = rec.beschreibung || cleanTags(e.text); else if (fk.v === 'icon' && !rec.icon) rec.icon = e.text; } } }
        else if (t[v0].v === '[' && t[v0].m > 0) { const f = args(t, v0); if (f[0]) rec.name = rec.name || cleanTags(exprText(t, f[0][0], f[0][1]).text); if (f[1]) rec.beschreibung = rec.beschreibung || cleanTags(exprText(t, f[1][0], f[1][1]).text); }
        rec.definiertIn.push({ datei: S.file, zeile: kk.l, konstante: t[i + 1].v }); } }
  } }
const itemList = Object.values(items).sort((a, b) => a.key.localeCompare(b.key));
itemList.forEach(r => { r.Name = 'ITEM_' + r.key.replace(/[^A-Za-z0-9_]/g, '_'); });
// Zusatz: Kapitelhinweis aus Vergabedatei
itemList.forEach(r => { const f = (r.vergebenIn[0] || r.definiertIn[0] || {}).datei; r.kapitelModul = f ? FILE_KAP[path.basename(f, '.js')] : undefined; });
write('items.json', { items: itemList, ungeklaert: itemsRaw });
MAN.zahlen.items = { gesamt: itemList.length, mitName: itemList.filter(r => r.name).length, mitVergabe: itemList.filter(r => r.vergebenIn.length).length, ungeklaert: itemsRaw.length };

// ---------------------------------------------------------------- 5) Rätsel (Markdown übernehmen)
function mdParse(file) {
  const txt = read(file), lines = txt.split(/\r?\n/); const out = { datei: rel(file), titel: (lines.find(l => /^# /.test(l)) || '').replace(/^# /, ''), abschnitte: [] }; let cur = null;
  for (let n = 0; n < lines.length; n++) { const l = lines[n]; const h = /^(#{2,4})\s+(.*)$/.exec(l);
    if (h) { cur = { ebene: h[1].length, titel: h[2].trim(), zeile: n + 1, text: [], tabellen: [] }; out.abschnitte.push(cur); continue; }
    if (!cur) { cur = { ebene: 1, titel: '(Einleitung)', zeile: 1, text: [], tabellen: [] }; out.abschnitte.push(cur); }
    if (/^\s*\|.*\|\s*$/.test(l)) { // Tabellenzeile
      const cells = l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      let tb = cur.tabellen[cur.tabellen.length - 1]; if (!tb || tb.ende) { tb = { kopf: null, zeilen: [], ende: false }; cur.tabellen.push(tb); }
      if (!tb.kopf) tb.kopf = cells; else if (/^[-: ]+$/.test(cells.join(''))) { } else tb.zeilen.push(cells);
    } else { const tb = cur.tabellen[cur.tabellen.length - 1]; if (tb && !tb.ende) tb.ende = true; if (l.trim()) cur.text.push(l); } }
  out.abschnitte.forEach(a => a.tabellen.forEach(tb => { delete tb.ende; tb.zeilenObjekte = tb.zeilen.map(z => Object.fromEntries(tb.kopf.map((h, i) => [h, z[i] || '']))); }));
  return out;
}
const raetsel = { raetselTabellen: [], quellen: [] };
for (const f of ['qa_raetsel_k12.md', 'qa_raetsel_k34.md', 'qa_raetsel_k56.md', 'qa_items.md']) { const p = path.join(REPO, 'docs', 'gameplay', f); if (!fs.existsSync(p)) { warn('fehlt', f); continue; } try { const m = mdParse(p); raetsel.quellen.push(m); } catch (e) { warn('md ' + f, e); } }
for (const q of raetsel.quellen) for (const a of q.abschnitte) for (const tb of a.tabellen) {
  if (!tb.kopf) continue; const o = /R.tsel|H.rde/i.test(tb.kopf[0] || '') ? 0 : (/R.tsel|H.rde/i.test(tb.kopf[1] || '') ? 1 : -1); if (o < 0 || tb.kopf.length < o + 3) continue;
  const col = i => tb.kopf[o + i];
  tb.zeilenObjekte.forEach((z, n) => raetsel.raetselTabellen.push({ Name: 'PUZ_' + path.basename(q.datei, '.md').replace(/^qa_raetsel_/, '') + '_' + (o ? String(z[tb.kopf[0]]).replace(/[^A-Za-z0-9]+/g, '_') : String(n + 1)), quelle: q.datei, abschnitt: a.titel, nummer: o ? z[tb.kopf[0]] : String(n + 1), raetsel: z[col(0)], loesung: z[col(1)], hinweise: z[col(2)], bewertung: z[col(3)] || '', verbesserung: z[col(4)] || '' }));
}
{ const u = {}; for (const r of raetsel.raetselTabellen) { u[r.Name] = (u[r.Name] || 0) + 1; if (u[r.Name] > 1) r.Name += '_' + u[r.Name]; } }
write('raetsel.json', raetsel);
MAN.zahlen.raetsel = { raetselZeilen: raetsel.raetselTabellen.length, mdAbschnitte: raetsel.quellen.reduce((s, q) => s + q.abschnitte.length, 0) };

// ---------------------------------------------------------------- 6) Orte / Räume / Koordinaten
const orte = { konstanten: [], haeuser: [], echos: [], kartenblaetter: null, kapitelUrsprung: { C2: evaled.C2, C3: evaled.C3, C4: evaled.C4 } };
const PLACE = /^(WALD|AMT|houses|KARTE_BL|KARTE_LEER|KB_RAUM|POST_RAUM|K5_POS|K6_ZONEN|K6_BUS|BEOB_ORTE|ZEICHEN_ORTE|BW_RAEUME|SCHRECK_ORTE|GEDANKEN_ORTE|KF_ORTE|NR4_ORT|KL_ORT_GRUPPEN|WHISKEY_ORTE|TRAUM_BOOK|TRAUM_PERCH|[A-Z0-9]*_(ORT|ORTE|POS|RAUM|RAEUME|ZONEN|PLAETZE|PUNKTE)|VILLA_[A-Z]+|WEISS_[A-Z]+_POS)$/;
for (const S of ALLSRC) { const t = S.toks;
  for (let i = 0; i < t.length - 3; i++) if (t[i].t === 'id' && /^(const|let|var)$/.test(t[i].v) && PLACE.test(t[i + 1].v) && t[i].p === -1) { const r = evalConst(S, t[i + 1].v); if (r) orte.konstanten.push({ Name: 'LOC_' + t[i + 1].v, konstante: t[i + 1].v, datei: r.datei, zeile: r.zeile, wert: r.wert }); } }
if (evaled.houses) orte.haeuser = evaled.houses.map(h => ({ Name: 'HOUSE_Nr' + h.n, nummer: h.n, x: h.x, z: h.z, breite: h.w, tiefe: h.d, ausrichtung: h.facing, hohl: !!h.hollow, ziegel: !!h.brick, veranda: !!h.porch, garage: h.garage }));
orte.kartenblaetter = evaled.KARTE_BL || null;
for (const S of ALLSRC) { const t = S.toks; for (const E of S.echoR) { const raw = S.code.slice(t[E.a].s, t[E.b].e); const at = /\bat\s*:\s*(\[[^\]]*\])/.exec(raw), ti = /title\s*:\s*(['"`])(.*?)\1/.exec(raw); let pos = null; if (at) { try { pos = evalLit(at[1]); } catch (e) { pos = null; } }
  const figs = (raw.match(/E_\(/g) || []).length; const lines = dialoge.filter(d => d.echo === E.id).map(d => d.Name);
  orte.echos.push({ Name: 'ECHO_' + E.id.replace(/^echo_/, ''), id: E.id, titel: ti ? ti[2] : '', position: pos, positionQuelltext: at ? at[1] : undefined, figurenAnzahl: figs, dialogZeilen: lines, datei: S.file, zeile: t[E.i].l }); } }
write('orte.json', orte);
MAN.zahlen.orte = { konstanten: orte.konstanten.length, haeuser: orte.haeuser.length, echos: orte.echos.length, kartenblaetter: (orte.kartenblaetter || []).length };

// ---------------------------------------------------------------- 7) Figuren und Besetzung
const figuren = { chars: [], cast: null, stimmenBesetzung: null, sprecherZuStimme: wer, echoBesetzung: orte.echos.map(e => ({ echo: e.id, titel: e.titel, figuren: e.figurenAnzahl })), erwachseneHinweise: [] };
try { figuren.chars = JSON.parse(read(path.join(REPO, 'game', 'assets', 'chars', 'chars.json'))).map(c => ({ Name: 'CHAR_' + c.id, id: c.id, name: c.name, hoehe: c.height, clips: c.clips && c.clips.length, tris: c.tris, hautfarbe: c.skin })); } catch (e) { warn('chars.json', e); }
try { figuren.cast = JSON.parse(read(path.join(REPO, 'app', 'tools', 'cast.json'))); } catch (e) { warn('cast.json', e); }
try { if (STIMMEN) { const b = JSON.parse(read(path.join(STIMMEN, 'besetzung.json'))); figuren.stimmenBesetzung = b.figuren.map(f => ({ Name: 'VOICE_' + f.id, id: f.id, name: f.name, info: f.info, design: f.design, seed: f.seed, post: f.post, zeilenProben: (f.lines || []).length })); figuren.stimmenExtras = b.extras; } else warn('HAM_Stimmen', 'Ordner nicht gefunden'); } catch (e) { warn('besetzung.json', e); }
// Figuren.js Kopfkommentar (Erwachsene/Kinder-Listen)
if (SRC['figuren.js']) figuren.figurenJsKopf = SRC['figuren.js'].raw.split(/\r?\n/).slice(0, 6).filter(l => l.startsWith('//')).map(l => l.replace(/^\/\/\s?/, ''));
// Dialogzahl je Sprecher
{ const c = {}; for (const d of dialoge) if (d.sprecher) c[d.sprecher] = (c[d.sprecher] || 0) + 1; figuren.zeilenJeSprecher = Object.entries(c).sort((a, b) => b[1] - a[1]).map(([s, n]) => ({ sprecher: s, stimme: wer[s] || '', zeilen: n })); }
// Geister-Doku (Echo-Besetzung, Regie)
try { figuren.geisterDoku = mdParse(path.join(REPO, 'docs', 'gameplay', 'geister.md')); } catch (e) { warn('geister.md', e); }
write('figuren.json', figuren);
MAN.zahlen.figuren = { chars: figuren.chars.length, stimmen: (figuren.stimmenBesetzung || []).length, echos: figuren.echoBesetzung.length, sprecherLabels: Object.keys(wer).length };

// ---------------------------------------------------------------- 8) Kapitelstruktur und Beats
const kap = { module: [], beats: {}, kapitelModule: {}, storyGliederung: [], kapitelStartEnde: [] };
for (const S of ALLSRC) { const head = S.raw.split(/\r?\n/).slice(0, 14).filter(l => l.startsWith('//')).map(l => l.replace(/^\/\/\s?=*\s*/, '')).filter(Boolean);
  kap.module.push({ modul: S.name, datei: S.file, bytes: Buffer.byteLength(S.raw), zeilen: S.raw.split('\n').length, kopf: head.slice(0, 8), kapitelHinweis: FILE_KAP[S.name] }); }
for (const S of ALLSRC) { const t = S.toks; for (let i = 0; i < t.length - 3; i++) if (t[i].t === 'id' && /^(const|let|var)$/.test(t[i].v) && /_BEATS$/.test(t[i + 1].v) && t[i + 2].v === '=' && t[i + 3].v === '[' && t[i + 3].m > 0) kap.beats[t[i + 1].v] = { datei: S.file, zeile: t[i].l, beats: args(t, i + 3).map(r => (single(t, r[0], r[1]) || {}).v) }; }
for (const [n, mods] of Object.entries({ 1: ['kapitel1', 'zimmer7', 'kiffen', 'albers', 'cleo', 'uebergang'], 2: ['amt', 'akte', 'innen_kapitel', 'feuer', 'lwo'], 3: ['kapitel3', 'justin', 'weiss', 'neben3', 'lucy3', 'innen_kapitel'], 4: ['anwesen', 'villa', 'neben4', 'nr4'], 5: ['kapitel5', 'neben5', 'kirchberg', 'post', 'ausbau_nord'], 6: ['kapitel6', 'wald', 'tiefwald', 'neben6', 'hungrige'] })) kap.kapitelModule[n] = mods.filter(m => SRC[m + '.js']);
const KB = SRC['kapitel.js']; if (KB) { const t = KB.toks; for (let i = 0; i < t.length; i++) if (t[i].t === 'id' && /^(KAP_BEGIN|KAP_END)$/.test(t[i].v) && t[i + 1].v === '[' && t[i + 2].t === 'num') kap.kapitelStartEnde.push({ art: t[i].v, kapitel: +t[i + 2].v, datei: KB.file, zeile: t[i].l }); }
for (const S of ALLSRC) { const t = S.toks; for (let i = 0; i < t.length; i++) if (t[i].t === 'id' && /^(KAP_BEGIN|KAP_END)$/.test(t[i].v) && t[i + 1].v === '[' && t[i + 2].t === 'num' && S !== KB) kap.kapitelStartEnde.push({ art: t[i].v, kapitel: +t[i + 2].v, datei: S.file, zeile: t[i].l }); }
try { const sp = path.join(REPO, 'app', 'story', 'story_final.md'); const lines = read(sp).split(/\r?\n/); lines.forEach((l, n) => { const h = /^(#{1,4})\s+(.*)$/.exec(l); if (h) kap.storyGliederung.push({ ebene: h[1].length, titel: h[2].trim(), zeile: n + 1 }); }); } catch (e) { warn('story_final.md', e); }
write('kapitel.json', kap);
MAN.zahlen.kapitel = { module: kap.module.length, beatListen: Object.keys(kap.beats).length, beatsGesamt: Object.values(kap.beats).reduce((s, b) => s + b.beats.length, 0), storyUeberschriften: kap.storyGliederung.length };

// ---------------------------------------------------------------- 9) Audio
const audio = { inventar: null, dateien: [], gruppen: {} };
try { audio.inventar = mdParse(path.join(REPO, 'docs', 'gameplay', 'klang_inventar.md')); } catch (e) { warn('klang_inventar.md', e); }
const walk = (dir, cb) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p, cb); else cb(p); } };
try { walk(path.join(REPO, 'game', 'audio'), p => { const st = fs.statSync(p); const n = path.basename(p); const pre = (/^([a-z]+)_/.exec(n) || [, 'sonst'])[1]; audio.dateien.push({ Name: 'SND_' + n.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9_]/g, '_'), datei: rel(p), bytes: st.size, gruppe: pre }); audio.gruppen[pre] = (audio.gruppen[pre] || 0) + 1; }); } catch (e) { warn('game/audio', e); }
write('audio.json', audio);
MAN.zahlen.audio = { dateien: audio.dateien.length, bytes: audio.dateien.reduce((s, d) => s + d.bytes, 0), gruppen: audio.gruppen, inventarTabellenZeilen: audio.inventar ? audio.inventar.abschnitte.reduce((s, a) => s + a.tabellen.reduce((s2, tb) => s2 + tb.zeilen.length, 0), 0) : 0 };

// ---------------------------------------------------------------- 10) Credits und Asset-Inventar
const credits = { abschnitte: [] };
try { const m = mdParse(path.join(REPO, 'CREDITS.md')); for (const a of m.abschnitte) { const rows = []; a.tabellen.forEach(tb => tb.zeilenObjekte.forEach(z => rows.push(z))); credits.abschnitte.push({ titel: a.titel, ebene: a.ebene, text: a.text.slice(0, 6), zeilen: rows }); } } catch (e) { warn('CREDITS.md', e); }
write('credits.json', credits);
MAN.zahlen.credits = { abschnitte: credits.abschnitte.length, zeilen: credits.abschnitte.reduce((s, a) => s + a.zeilen.length, 0) };
const assets = { wurzel: 'game/assets', ordner: [] };
try { const root = path.join(REPO, 'game', 'assets'); for (const e of fs.readdirSync(root, { withFileTypes: true })) { if (!e.isDirectory()) continue; const o = { ordner: e.name, bytes: 0, dateien: 0, typen: {}, unterordner: [] }; const p0 = path.join(root, e.name); walk(p0, p => { const st = fs.statSync(p); o.bytes += st.size; o.dateien++; const ext = path.extname(p).toLowerCase() || '(ohne)'; o.typen[ext] = (o.typen[ext] || 0) + 1; }); for (const s of fs.readdirSync(p0, { withFileTypes: true })) if (s.isDirectory()) { let b = 0, n = 0; walk(path.join(p0, s.name), p => { b += fs.statSync(p).size; n++; }); o.unterordner.push({ name: s.name, bytes: b, dateien: n }); } o.unterordner.sort((a, b) => b.bytes - a.bytes); assets.ordner.push(o); } assets.ordner.sort((a, b) => b.bytes - a.bytes); assets.summeBytes = assets.ordner.reduce((s, o) => s + o.bytes, 0); } catch (e) { warn('assets', e); }
write('assets.json', assets);
MAN.zahlen.assets = { ordner: assets.ordner.length, gb: +(assets.summeBytes / 1e9).toFixed(2) };

write('_manifest.json', MAN);
console.log(JSON.stringify(MAN.zahlen, null, 1)); if (MAN.fehler.length) console.log('Fehler/Hinweise:', MAN.fehler.length, MAN.fehler.slice(0, 20));
