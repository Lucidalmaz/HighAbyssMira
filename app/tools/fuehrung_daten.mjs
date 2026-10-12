// Erzeugt app/mods/fuehrung_daten.js aus docs/gameplay/fuehrung_texte.json (Quelle der Wahrheit für Texte der Story-Führung/Tutorial/Ortsschild).
// Aufruf: node app/tools/fuehrung_daten.mjs
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..', '..');
const J = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'gameplay', 'fuehrung_texte.json'), 'utf8')).eintraege;
const by = a => J.filter(e => a.includes(e.art));
const D = { kk: {}, bisher: {}, phase: {}, om: [], zl: [], wa: [], gf: [], tp: [], sc: {}, sz: [] };
for (const e of by(['kapitelkarte_kopf'])) (D.kk[e.kapitel] = D.kk[e.kapitel] || {}).kopf = e.text;
for (const e of by(['kapitelkarte_ortzeit'])) (D.kk[e.kapitel] = D.kk[e.kapitel] || {}).ortzeit = e.text;
for (const e of by(['kapitelkarte_ziel'])) (D.kk[e.kapitel] = D.kk[e.kapitel] || {}).ziel = e.text.replace(/^ZIEL:\s*/, '');
for (const e of by(['bisher'])) (D.bisher[e.kapitel] = D.bisher[e.kapitel] || []).push(e.text);
for (const e of by(['phase'])) (D.phase[e.kapitel] = D.phase[e.kapitel] || []).push(e.text);
for (const e of by(['ortsmarke'])) D.om.push({ id: e.id, k: e.kapitel, z1: e.zeile1, z2: e.zeile2 || '' });
for (const e of by(['zielzeile'])) D.zl.push({ id: e.id, k: e.kapitel, text: e.text, alt: e.ersetzt || '' });
for (const e of by(['warum'])) D.wa.push({ id: e.id, k: e.kapitel, rx: e.regex, text: e.text });
for (const e of by(['gedanke_faden'])) D.gf.push({ id: e.id, k: e.kapitel, rx: e.regex, text: e.text });
for (const e of by(['tipp'])) D.tp.push({ id: e.id, k: e.kapitel, text: e.text, zeilen: e.text.split(' / ') });
for (const e of J.filter(x => /^FS-1-(SC|KZ)-/.test(x.id))) D.sc[e.id] = e.text;
for (const e of by(['sprecher_zuordnung', 'sprecher_kennung'])) D.sz.push({ id: e.id, text: e.text, ausloeser: e.ausloeser });
const out = '// ERZEUGT von app/tools/fuehrung_daten.mjs aus docs/gameplay/fuehrung_texte.json – nicht von Hand ändern (Texte dort ändern, Skript erneut ausführen).\r\n'
  + 'const FS_D = ' + JSON.stringify(D, null, 1).replace(/\n/g, '\r\n') + ';\r\n';
fs.writeFileSync(path.join(ROOT, 'app', 'mods', 'fuehrung_daten.js'), out);
console.log('fuehrung_daten.js:', Object.keys(D).map(k => k + '=' + (Array.isArray(D[k]) ? D[k].length : Object.keys(D[k]).length)).join(' '));
