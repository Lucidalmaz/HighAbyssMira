// AP-MOCAP: Clip-Katalog (Markdown-Tabelle) aus cast.json → mocap und den gebackenen Metadaten (mama, zayn, polizist) für story/audit/F3_stand_mocap.md
import fs from 'fs'; import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const C = JSON.parse(fs.readFileSync('tools/cast.json', 'utf8')), MC = C.mocap, io = new NodeIO().registerExtensions(ALL_EXTENSIONS), M = {};
for (const id of ['mama', 'zayn', 'polizist', 'vegas']) { const d = await io.read('../game/assets/chars/' + id + '/model.glb'); M[id] = d.getRoot().listScenes()[0].getExtras().motion || {}; }
const USE = { idle: 'Stehen (Grundhaltung)', idle2: 'Stehen, Gewicht verlagern / Arme verschränkt', idle3: 'Stehen, zuhören (echte Mocap)', look: 'sich umsehen', nervous: 'panisch umsehen', alert: 'wachsam stehen',
  walk: 'Gehen', walk_vorsicht: 'vorsichtig gehen', walk_muede: 'müde gehen', walk_zurueck: 'rückwärts gehen', schleichen: 'auf Zehenspitzen schleichen', run: 'Joggen/Laufen', run_panik: 'Panik-Lauf',
  turn_l: 'auf der Stelle 90° links drehen', turn_r: '90° rechts drehen', turn_180: 'umdrehen', fear: 'zurückweichen (Angst)', ohren_zu: 'Ohren zuhalten', crouch: 'hocken',
  talk: 'sprechen', talk_wut: 'wütend sprechen', talk2: 'ernstes Gespräch', listen: 'zuhören', gestik: 'lebhaft gestikulieren', erklaeren: 'weit ausholend erklären',
  sit: 'sitzen (aufrecht)', sit2: 'sitzen (zusammengesunken)', sit_talk: 'sitzend sprechen', sit_down: 'hinsetzen', stand_up: 'aufstehen vom Stuhl', getup: 'vom Boden aufstehen (Rokoko)', getup_floor: 'aus Bauchlage aufstehen',
  lean_wall: 'an Wand lehnen, ausruhen', wand_ruecken: 'Rücken an die Wand', phone: 'aufs Handy schauen', nick: 'nicken', kopfschuetteln: 'Kopf schütteln', winken: 'winken', klopfen: 'an Tür klopfen', aufheben: 'vom Boden aufheben', trinken: 'aus Tasse trinken', hug: 'umarmen',
  arme_verschraenkt: 'Arme verschränken (trotzig)', schulterzucken: 'Schulterzucken', nachdenken: 'nachdenken (Kinn)', facepalm: 'Hand vors Gesicht', warten: '„Moment!“ Hand heben', enttaeuscht: 'enttäuscht', erschoepft: 'erschöpft atmen', haende_knie: 'Hände auf Knie, außer Atem',
  weinen: 'weinen', schwanken: 'kaum stehen, schwanken', zusammenbruch: 'auf die Knie sinken', window: 'aus dem Fenster schauen', window_lean: 'vorgebeugt aus Fenster schauen', window_knock: 'an Scheibe klopfen/winken',
  stairs_up: 'Treppe hoch', stairs_down: 'Treppe runter', starren: 'starr blicken', walk_stock: 'am Stock humpeln (Stock als Requisit fehlt)', husten: 'Hustenanfall',
  z_idle: 'Hungriger: stehen/schwanken', z_idle2: 'Hungriger: stehen (2)', z_walk: 'Hungriger: schlurfen', z_run: 'Hungriger: rennen', z_attack: 'Hungriger: Angriff', z_crawl: 'Hungriger: kriechen', z_death: 'Hungriger: zusammenbrechen', fremd: 'etwas Seltsames tun' };
const rows = [], seen = new Set();
for (const [set, clips] of Object.entries(MC.sets)) for (const [name, [src, o]] of Object.entries(clips)) { const key = name + '|' + set; if (seen.has(key)) continue; seen.add(key);
  const m = (set === 'kid' ? M.zayn : set === 'zombie' ? M.polizist : set === 'old' ? M.vegas : M.mama)[name] || {}, f = (MC.src[src] || '').replace(/^.*\//, '');
  rows.push(`| ${name} | ${set} | ${USE[name] || ''} | ${f} | ${m.dur ? m.dur.toFixed(1) : '?'} s | ${o.rm}${o.loop === false ? ', einmal' : ', Schleife'}${m.speed ? ', ' + m.speed.toFixed(2) + ' m/s' : ''}${m.turn && Math.abs(m.turn) > .3 ? ', ' + Math.round(m.turn * 57.3) + '°' : ''} |`); }
console.log('| Clip | Satz | Einsatz | Quelle (Datei) | Länge | Art |\n|---|---|---|---|---|---|\n' + rows.join('\n'));
