#!/usr/bin/env node
// Erzeugt docs/unreal/ASSET_LISTE.md (Anhang zu ASSET_PLAN.md) und docs/unreal/data/asset_klassifikation.json aus CREDITS.md.
// Die Einstufung ist eine REGEL-HEURISTIK (Stichworte in Werk/Verwendung/Urheber) - Vorschlag, keine Entscheidung. Prüfen vor dem Einkauf/Import.
// Aufruf: node app/tools/ue_export/gen_asset_liste.js
'use strict';
const fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '..', '..', '..');
const md = fs.readFileSync(path.join(REPO, 'CREDITS.md'), 'utf8').split(/\r?\n/);

// ---- CREDITS.md in Abschnitte
const sec = []; let cur = null;
for (const l of md) { const h = /^##\s+(.*)$/.exec(l); if (h) { cur = { titel: h[1], zeilen: [] }; sec.push(cur); continue; } if (cur) cur.zeilen.push(l); }
const rows = [];
function fromTable(s, lizenz) {
  for (const l of s.zeilen) { if (!/^\|/.test(l)) continue; const c = l.trim().replace(/^\||\|$/g, '').split('|').map(x => x.trim()); if (c.length < 4 || /^-+$/.test(c[0]) || c[0] === 'Werk') continue; rows.push({ werk: c[0], urheber: c[1], verwendung: c[2], link: c[3], lizenz, abschnitt: s.titel }); }
}
for (const s of sec) { if (/^CC-BY/.test(s.titel)) fromTable(s, 'CC-BY 4.0 (Namensnennung)'); else if (/^Sketchfab/.test(s.titel)) fromTable(s, 'CC-BY 4.0 (Sketchfab, Ausnahme freigegeben)'); }
// Fab-Standardlizenz: Aufzählungen "**Urheber** – Werk (Verwendung) · **Urheber** – Werk"
const std = sec.find(s => /^Fab-Standardlizenz/.test(s.titel));
if (std) for (const l of std.zeilen) { if (!/^- /.test(l)) continue; for (const part of l.replace(/^- /, '').split(' · ')) { const m = /^\*\*(.+?)\*\*\s*[–-]\s*(.*)$/.exec(part.trim()); if (m) rows.push({ werk: m[2].replace(/\(Epics.*$/, '').trim(), urheber: m[1], verwendung: '', link: '', lizenz: 'Fab-Standardlizenz (Personal/Professional)', abschnitt: std.titel }); } }

// ---- Einstufung
const VEG = /Baum|Bäume|Pine|Tree|Trunk|Stump|Stümpfe|Strünk|Ivy|Efeu|Moss|Moos|Grass|Gras|Leaves|Laub|Fern|Mushroom|Pilz|Birch|Birke|Clover|Klee|Branch|Äste|Büsche|Unterholz|Rose|Raspberry|Elderberry|Bolete|Weeds|Vegetation|Wild/i;
const FIG = /Animated|Rigged|Character|Girl|Worker|Cop|Spy|Doctor|Farmer|Paladin|Hair|Locken|Curly|Frisur|Mixamo/i;
const KREATUR = /Deer Thing|Grimhound|Muscle|Alien Pet|Zombie|Wolf|Raven|Crow|Animal Variety|Dog|Cow|Cat |Antiradiation|antiradiation/i;
const SCAN = /Megascans|Quixel/i;
function klass(r) {
  const t = `${r.werk} ${r.verwendung} ${r.urheber}`;
  if (SCAN.test(t)) return ['Megascans/Scan', 'UE-nativ in Fab/Bridge laden (Nanite, 8k) - das Spiel nutzt nur verkleinerte Web-Fassungen', 'ersetzen (hochwertiger)'];
  if (/Flanagan/i.test(r.urheber) && FIG.test(t) && !/Zombie/i.test(r.werk)) return ['Figur (Mixamo-Rig)', 'Erwachsene -> MetaHuman; Animationen bleiben als Retarget-Quelle (IK Retargeter Mixamo -> MetaHuman)', 'ersetzen durch MetaHuman'];
  if (/NoEdge|Motifect|Mocap|Animation Shopee|Toei|nikoff|Animpacks|BTM|DZTFIX|Teddy/i.test(r.urheber)) return ['Figur/Bewegung', 'Kinder: NoEdge-Körper bleiben Option; Mocap-Sets (FBX) 1:1 als Animationsquelle retargeten', '1:1 (Anim) / pruefen (Koerper)'];
  if (KREATUR.test(t)) return ['Kreatur/Tier', 'Original-FBX von Fab erneut laden; Rig, Clips und Shader (Wachshaut, Brand) in UE neu aufsetzen', '1:1 + Nacharbeit'];
  if (VEG.test(t)) return ['Vegetation', 'Web-Fassung ist Low-Poly: durch Megascans/Fab-Nanite-Foliage (UE-nativ, Wind/PCG-tauglich) ersetzen', 'ersetzen'];
  if (/Hair|Haar|Locken|Curly|Frisur|Beret|Mütze|Eyeglass|Brille/i.test(t)) return ['Haar/Zubehör', 'Haare: MetaHuman-Grooms (Strand-basiert) statt Karten; Brille/Mütze 1:1 als Accessoire-Mesh', 'ersetzen / 1:1'];
  return ['Requisite', 'Original-Download erneut laden (FBX/UE-Format auf Fab); Texturen im Original statt 1k-Reduktion', '1:1 uebernehmbar'];
}
rows.forEach(r => { const [k, plan, urteil] = klass(r); r.kategorie = k; r.planUnreal = plan; r.urteil = urteil; });

const cnt = {}; rows.forEach(r => { cnt[r.urteil] = (cnt[r.urteil] || 0) + 1; });
fs.writeFileSync(path.join(REPO, 'docs', 'unreal', 'data', 'asset_klassifikation.json'), JSON.stringify({ erzeugtAus: 'CREDITS.md', zeilen: rows.length, nachUrteil: cnt, eintraege: rows }, null, 1), 'utf8');

const esc = s => String(s || '').replace(/\|/g, '/').replace(/\s+/g, ' ');
const byCat = {}; rows.forEach(r => (byCat[r.kategorie] = byCat[r.kategorie] || []).push(r));
let out = `# ASSET_LISTE - generierter Anhang zu ASSET_PLAN.md\n\n_Erzeugt von \`app/tools/ue_export/gen_asset_liste.js\` aus \`CREDITS.md\` (${new Date().toISOString().slice(0, 10)}). Die Spalte "Urteil" ist eine Stichwort-Heuristik als Vorschlag - vor Import bzw. Kauf prüfen. Nichts kaufen ohne Rückfrage._\n\n`;
out += `**${rows.length} Einträge** (CC-BY ${rows.filter(r => /^CC-BY/.test(r.lizenz)).length}, Sketchfab ${rows.filter(r => /Sketchfab/.test(r.lizenz)).length}, Fab-Standardlizenz ${rows.filter(r => /Standard/.test(r.lizenz)).length}). Urteile: ${Object.entries(cnt).map(([k, v]) => `${k} ${v}`).join(' · ')}.\n\n`;
out += `CC-BY verlangt Namensnennung auch in der UE-Fassung: \`CREDITS.md\` bleibt Pflichtbestandteil (Credits-Bildschirm im Spiel).\n\n`;
for (const [k, list] of Object.entries(byCat).sort((a, b) => b[1].length - a[1].length)) {
  out += `## ${k} (${list.length})\n\n_Plan:_ ${list[0].planUnreal}\n\n| Werk | Urheber | Verwendung im Spiel | Lizenz | Urteil | Link |\n|---|---|---|---|---|---|\n`;
  for (const r of list) out += `| ${esc(r.werk)} | ${esc(r.urheber)} | ${esc(r.verwendung)} | ${esc(r.lizenz)} | ${esc(r.urteil)} | ${r.link ? esc(r.link) : ''} |\n`;
  out += '\n';
}
fs.writeFileSync(path.join(REPO, 'docs', 'unreal', 'ASSET_LISTE.md'), out, 'utf8');
console.log(JSON.stringify({ zeilen: rows.length, nachUrteil: cnt, kategorien: Object.fromEntries(Object.entries(byCat).map(([k, v]) => [k, v.length])) }, null, 1));
