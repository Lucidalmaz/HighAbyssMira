// =====================================================================  WALDLEBEN (Modul „waldleben“): der Wald ist bewachsen, bewegt sich und klingt
// Forbidden Dustwoods (WALD) und tiefer Wald (TIEF) bekommen zwischen den toten Bäumen lebendes Grün und Bodenleben, alles echte Scans (Fab, CC-BY,
// siehe CREDITS.md): Kiefern (Big bubble), Laubbäume und Büsche (Nicholas 3D), alte Kiefernstrünke (Drakery), bemooste und faulende Stümpfe
// (Indy Sarlet, Ewan Lejkowski), Moosfelsen (Lassi Kaukonen), efeubewachsene und umgestürzte Stämme (matousekfoto, PersScans), Äste (Arkify3d),
// Laub (Zygomir, matousekfoto), Moos (Zygomir), Klee (Studio-Lab), Gras (Nicholas 3D, Charlie catling), Pilze (EFX).
// Verhalten: Wind lässt Gras, Büsche und Kronen schwingen (Böen stärker, synchron zum Windgeräusch), Pflanzen weichen dem Spieler aus, Büsche
// bremsen und rascheln (Grundspiel: weiche Körper). Klang: Windbett in den Kronen, Laubrascheln, Zweige, fallende Äste, Kiefernzapfen,
// kleine Tiere im Unterholz, Flügelschlag, Tropfen, Käuzchen, Rehe, fernes Heulen (Novembernacht: keine Grillen, keine Frösche).
const WL = { off: false, saum: null, saumT: 0, morgen: false, ready: false, chunks: [], chunkT: 0, uWind: { value: 0 }, uAmp: { value: 1 }, uPl: { value: new THREE.Vector3() }, gust: 0, gustT: 8, sndT: 3, bed: null, bedG: null, inForest: 0, n: {} };
function wl_in(x, z) { return (typeof wald_in === 'function' && wald_in(x, z)) || (typeof tief_in === 'function' && tief_in(x, z)); }
// Platz frei? (Wege, Hütten, Rätselorte bleiben frei; r = Abstand zum Weg)
function wl_free(x, z, r = 1.6) {
  if (typeof tief_in === 'function' && tief_in(x, z)) return tief_free(x, z, r);
  if (typeof wald_in === 'function' && wald_in(x, z)) return wald_free(x, z) && wald_pathDist(x, z) > r;
  return false;
}
// Wind + Ausweichen: Schwingen nach Höhe im Modell (h = Modellhöhe), Weg vom Spieler (push)
function wl_wind(mat, amp, h, push) {
  if (mat.userData.wl) return mat;
  // Schon von einem anderen Modul mit Wind gepatcht (z. B. ausbau_nord: addWind am gemeinsamen Holunder-Material)? Dann nicht doppelt schwingen lassen.
  const own = Object.prototype.hasOwnProperty.call(mat, 'onBeforeCompile'), prevKey = own && mat.customProgramCacheKey ? String(mat.customProgramCacheKey()) : '';
  if (own && /wind/i.test(prevKey)) return mat;
  mat.userData.wl = true; const prev = own ? mat.onBeforeCompile : null;
  const uH = { value: h }, uA = { value: amp }, uP = { value: push ? 1 : 0 };
  // gemeinsamer Windzustand der Basis (windVert): geschichtet, Böenfronten, Blattflattern; Ausweichen vor Luke federt gedämpft zurück (R-7)
  mat.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r); sh.uniforms.uWH = uH; sh.uniforms.uWA = uA; sh.uniforms.uWP = uP;
    windVert(sh, 'uWA * pow(clamp(position.y / uWH, 0., 1.), 2.)', '.35', 'uWP * .42'); sh.vertexShader = 'uniform float uWH, uWA, uWP;\n' + sh.vertexShader; };
  mat.customProgramCacheKey = () => 'wl_wind2|' + prevKey; mat.needsUpdate = true; return mat; // eigener Schlüssel je Vor-Patch: kein falsches Teilen von Shader-Programmen
}
// Modell → Gruppen (Packs mit mehreren Varianten werden getrennt), jede Gruppe auf Fußpunkt 0 und optional flach gelegt
async function wl_asset(key, { split = false, flat = false } = {}) {
  const parts = await msBake('w_' + key, 'model.glb'); if (!parts.length) return [];
  for (const p of parts) p.geo.computeBoundingBox();
  let groups = [parts];
  if (split) { const par = parts.map((_, i) => i), f = i => par[i] === i ? i : (par[i] = f(par[i]));
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) { const a = parts[i].geo.boundingBox, b = parts[j].geo.boundingBox;
      if (a.min.x <= b.max.x && b.min.x <= a.max.x && a.min.z <= b.max.z && b.min.z <= a.max.z) par[f(i)] = f(j); }
    const m = new Map(); parts.forEach((p, i) => { const r = f(i); if (!m.has(r)) m.set(r, []); m.get(r).push(p); }); groups = [...m.values()]; }
  return groups.map(G => { const bb = new THREE.Box3(); G.forEach(p => bb.union(p.geo.boundingBox)); const sz = bb.getSize(new THREE.Vector3());
    const M = new THREE.Matrix4();
    if (flat) { // dünnste Achse nach oben
      const ax = sz.x < sz.y && sz.x < sz.z ? 'x' : sz.z < sz.y ? 'z' : 'y'; if (ax === 'x') M.makeRotationZ(PI / 2); else if (ax === 'z') M.makeRotationX(-PI / 2); }
    const out = G.map(p => ({ geo: p.geo.clone().applyMatrix4(M), mat: p.mat })); const b2 = new THREE.Box3(); out.forEach(p => { p.geo.computeBoundingBox(); b2.union(p.geo.boundingBox); });
    const c = b2.getCenter(new THREE.Vector3()), T = new THREE.Matrix4().makeTranslation(-c.x, -b2.min.y, -c.z); out.forEach(p => { p.geo.applyMatrix4(T); p.geo.computeBoundingBox(); p.geo.computeBoundingSphere(); });
    const s2 = b2.getSize(new THREE.Vector3()); return { parts: wl_merge(out), size: s2, h: Math.max(.001, s2.y), w: Math.max(s2.x, s2.z) }; });
}
function wl_merge(parts) {
  const byM = new Map(); for (const p of parts) { if (!byM.has(p.mat)) byM.set(p.mat, []); byM.get(p.mat).push(p.geo); }
  const out = []; for (const [mat, geos] of byM) { if (geos.length === 1 || !WL.merge) { geos.forEach(g => out.push({ geo: g, mat })); continue; }
    const keys = Object.keys(geos[0].attributes).sort().join(), idx = !!geos[0].index; let m = null;
    if (geos.every(g => Object.keys(g.attributes).sort().join() === keys && !!g.index === idx)) { try { m = WL.merge(geos, false); } catch (e) { m = null; } }
    if (m) { m.computeBoundingBox(); m.computeBoundingSphere(); out.push({ geo: m, mat }); } else geos.forEach(g => out.push({ geo: g, mat })); }
  return out;
}
// Material für die Nacht vorbereiten: Alpha als Maske (schneller, sortierfrei), matt, etwas dunkler
function wl_mat(m, { dark = .75, alpha = null } = {}) {
  if (m.userData.wlPrep) return m; m.userData.wlPrep = true;
  if (m.transparent || m.alphaTest > 0 || alpha) { m.transparent = false; m.alphaTest = alpha || Math.max(m.alphaTest, .38); m.depthWrite = true; m.side = THREE.DoubleSide; }
  if (m.color) m.color.multiplyScalar(dark); m.roughness = Math.max(m.roughness ?? 1, .85); m.metalness = 0; m.envMapIntensity = Math.min(m.envMapIntensity ?? 1, .5); return m;
}
// Streuen: Liste [x,z,ry,s,tilt] → Blöcke je 24 m, nach Abstand ein-/ausblenden; noCol = man läuft durch
function wl_scatter(A, list, { vis = 40, shadow = false, noCol = false, cell = 24, y = 0, saum = false } = {}) {
  if (!A || !list.length) return; const byG = new Map();
  for (const L of list) { const gi = L.g ?? 0; if (!byG.has(gi)) byG.set(gi, []); byG.get(gi).push(L); }
  for (const [gi, arr] of byG) { const G = A[gi % A.length]; if (!G) continue; const cells = new Map();
    for (const L of arr) { const k = Math.floor(L.x / cell) + ',' + Math.floor(L.z / cell); let c = cells.get(k); if (!c) cells.set(k, c = { x: 0, z: 0, n: 0, M: [] }); c.x += L.x; c.z += L.z; c.n++;
      c.M.push(new THREE.Matrix4().compose(new THREE.Vector3(L.x, (L.y ?? y), L.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(L.tx || 0, L.ry, L.tz || 0)), new THREE.Vector3(L.s * (L.sx || 1), L.s * (L.sy || 1), L.s * (L.sx || 1)))); }
    for (const c of cells.values()) { const meshes = msInst(G.parts, c.M, { shadow }); for (const m of meshes) { m.frustumCulled = true; if (noCol === true || (noCol !== 'soft' && m.material.alphaTest > 0)) m.userData.noCol = true; }
      WL.chunks.push({ x: c.x / c.n, z: c.z / c.n, meshes, vis, sh: shadow ? 22 : 0, saum: saum && c.z / c.n < 121 }); } }
}
function wl_rand(x0, x1, z0, z1, n, r, test) { const out = []; for (let i = 0; i < n * 6 && out.length < n; i++) { const x = rand(x0, x1), z = rand(z0, z1); if (!wl_free(x, z, r) || (test && !test(x, z))) continue; out.push([x, z]); } return out; }
WORLD_MODS.push(['Waldleben', async () => {
  if (typeof WALD === 'undefined' || typeof TIEF === 'undefined') return;
  try { WL.merge = (await import('three/addons/utils/BufferGeometryUtils.js')).mergeGeometries; } catch (e) { WL.merge = null; }
  const T = THREE, load = (k, o) => wl_asset(k, o).catch(e => { console.warn('Waldleben: ' + k, e); return []; });
  const [pine, oldpine, trees, bushes, stumpR, stumpM, rocks, ivylog, fallen, branches, leaves, leafpile, moss, mossstick, clover, grass, tallgrass, mush, ivy] = await Promise.all([
    load('pineb'), load('oldpine'), load('moretrees', { split: true }), load('bushes2', { split: true }), load('stumprot'), load('mossytrunk'), load('mossrocks'), load('ivytrunk'), load('pinetrunk'),
    load('branches', { split: true }), load('leaves', { flat: true }), load('leftleaves'), load('mosspatch', { flat: true }), load('mossstick', { flat: true }), load('clover', { flat: true }),
    load('grasspack'), load('grassgame'), load('mushefx'), load('ivyplane')]);
  // Materialien: Nacht, Alpha-Masken, Wind (Amplitude in Metern an der Spitze)
  const prep = (A, o, wind) => A.forEach(G => G.parts.forEach(p => { wl_mat(p.mat, o); if (wind && (p.mat.alphaTest > 0 || wind.all)) wl_wind(p.mat, wind.amp, G.h, !!wind.push); }));
  prep(pine, { dark: .62 }, { amp: .9 }); prep(oldpine, { dark: .7 }); prep(trees, { dark: .6 }, { amp: .55 }); prep(bushes, { dark: .6 }, { amp: .35, push: true });
  prep(stumpR, { dark: .8 }); prep(stumpM, { dark: .75 }); prep(rocks, { dark: .75 }); prep(ivylog, { dark: .72 }); prep(fallen, { dark: .75 }); prep(branches, { dark: .7 });
  prep(leaves, { dark: .42, alpha: .45 }); prep(leafpile, { dark: .45 }); prep(moss, { dark: .5 }); prep(mossstick, { dark: .5 }); prep(clover, { dark: .62 }, { amp: .04, push: true, all: true });
  prep(grass, { dark: .6 }, { amp: .09, push: true, all: true }); prep(tallgrass, { dark: .55 }, { amp: .14, push: true, all: true }); prep(mush, { dark: .8 }); prep(ivy, { dark: .6 }, { amp: .04 });
  // Elder/Himbeere/Wildgras aus wald.js/tiefwald.js schwingen mit (gleiche Materialien aus dem Modell-Cache)
  for (const k of ['elderberry', 'raspberry', 'wildgrass1', 'wildgrass2']) try { const P = await msBake(k); const h = Math.max(...P.map(p => { p.geo.computeBoundingBox(); return p.geo.boundingBox.max.y; })); P.forEach(p => wl_wind(p.mat, k.startsWith('wild') ? .08 : .22, h, true)); } catch (e) {}
  const ZONES = [[WALD.x0 + 1, WALD.x1 - 1, WALD.z0 + 1, WALD.z1 - 1, .6], [TIEF.x0 + 1, TIEF.x1 - 1, TIEF.z0 + 1, TIEF.z1 - 1, 1]];
  const deep = z => Math.max(0, Math.min(1, (z - 120) / 140));
  const L = {}; const put = (k, x, z, s, o = {}) => (L[k] = L[k] || []).push(Object.assign({ x, z, ry: rand(0, 6.28), s }, o));
  // freigehaltene Baumplätze (wald.js/tiefwald.js): 70 % Kiefern, 30 % Laubbäume
  for (const [x, z] of (typeof WL_SLOTS !== 'undefined' ? WL_SLOTS : [])) { if (Math.random() < .7) put('pine', x, z, (pine[0] ? rand(12, 18) / pine[0].h : 1) * (1 + deep(z) * .15), { tx: rand(-.03, .03), tz: rand(-.03, .03) });
    else { const g = Math.floor(rand(0, trees.length)); put('trees', x, z, trees[g] ? rand(6, 10) / trees[g].h : 1, { g }); } }
  for (const [x0, x1, z0, z1, dens] of ZONES) { const A = (x1 - x0) * (z1 - z0) / 1000, N = n => Math.round(n * A * dens);
    // Bäume: Kiefern (dunkel, dicht), Laubbäume, alte Strünke
    for (const [x, z] of wl_rand(x0, x1, z0, z1, N(.8), 3.2)) put('pine', x, z, (pine[0] ? rand(12, 17) / pine[0].h : 1) * (1 + deep(z) * .15), { tx: rand(-.03, .03), tz: rand(-.03, .03) });
    for (const [x, z] of wl_rand(x0, x1, z0, z1, N(.6), 3)) { const g = Math.floor(rand(0, trees.length)); put('trees', x, z, trees[g] ? rand(5, 9) / trees[g].h : 1, { g }); }
    for (const [x, z] of wl_rand(x0, x1, z0, z1, N(1.1), 2.6)) put('oldpine', x, z, oldpine[0] ? rand(4, 7) / oldpine[0].h : 1);
    // Unterholz: Büsche (bremsen, rascheln)
    for (const [x, z] of wl_rand(x0, x1, z0, z1, N(7), 1.8)) { const g = Math.floor(rand(0, bushes.length)); put('bushes', x, z, bushes[g] ? rand(1.4, 3.2) / bushes[g].h : 1, { g }); }
    // Totholz, Stümpfe, Felsen
    for (const [x, z] of wl_rand(x0, x1, z0, z1, N(3), 2)) put('stumpR', x, z, stumpR[0] ? rand(.8, 1.4) / stumpR[0].w : 1);
    for (const [x, z] of wl_rand(x0, x1, z0, z1, N(2.2), 2)) put('stumpM', x, z, stumpM[0] ? rand(1, 1.8) / stumpM[0].w : 1);
    for (const [x, z] of wl_rand(x0, x1, z0, z1, N(.9), 3.5)) put('rocks', x, z, rocks[0] ? rand(2, 3.6) / rocks[0].w : 1);
    for (const [x, z] of wl_rand(x0, x1, z0, z1, N(1.1), 3.5)) put('ivylog', x, z, ivylog[0] ? rand(3.5, 6) / ivylog[0].w : 1);
    for (const [x, z] of wl_rand(x0, x1, z0, z1, N(1.4), 3)) put('fallen', x, z, fallen[0] ? rand(4, 7) / fallen[0].w : 1);
    // Boden: Äste, Laub, Moos, Klee, Gras, Pilze
    for (const [x, z] of wl_rand(x0, x1, z0, z1, N(14), .9)) { const g = Math.floor(rand(0, branches.length)); put('branches', x, z, branches[g] ? rand(.8, 2.2) / branches[g].w : 1, { g, y: .02 }); }
    for (const [x, z] of wl_rand(x0, x1, z0, z1, N(22), .2)) put('leaves', x, z, leaves[0] ? rand(1.6, 3.2) / leaves[0].w : 1, { y: .004 + rand(0, .004), sy: .5 });
    for (const [x, z] of wl_rand(x0, x1, z0, z1, N(8), 1)) put('leafpile', x, z, leafpile[0] ? rand(.9, 1.8) / leafpile[0].w : 1, { y: -.05, sy: .6 });
    for (const [x, z] of wl_rand(x0, x1, z0, z1, N(34), .6)) put('moss', x, z, moss[0] ? rand(.6, 1.3) / moss[0].w : 1, { y: -.01 });
    for (const [x, z] of wl_rand(x0, x1, z0, z1, N(10), 1)) put('mossstick', x, z, mossstick[0] ? rand(.9, 1.6) / mossstick[0].w : 1, { y: .01 });
    for (const [x, z] of wl_rand(x0, x1, z0, z1, N(28), .8)) put('clover', x, z, clover[0] ? rand(.5, 1) / clover[0].w : 1, { y: .005 });
    for (const [x, z] of wl_rand(x0, x1, z0, z1, N(60), .7)) put('grass', x, z, grass[0] ? rand(1.4, 2.4) / grass[0].w : 1);
    for (const [x, z] of wl_rand(x0, x1, z0, z1, N(26), 1)) put('tallgrass', x, z, tallgrass[0] ? rand(.6, 1.1) / tallgrass[0].h : 1);
  }
  // Pilze in Grüppchen an Stümpfen und Stämmen
  for (const s of [...(L.stumpR || []), ...(L.stumpM || []), ...(L.ivylog || [])]) { if (Math.random() < .55) continue; const n = 2 + Math.floor(rand(0, 4));
    for (let i = 0; i < n; i++) { const a = rand(0, 6.28), d = rand(.5, 1.1); put('mush', s.x + Math.cos(a) * d, s.z + Math.sin(a) * d, mush[0] ? rand(.06, .14) / mush[0].h : 1, { tx: rand(-.15, .15), tz: rand(-.15, .15) }); } }
  // Efeu an Kiefern- und Laubstämmen (Karten rund um den Stamm)
  for (const t of [...(L.pine || []).filter(() => Math.random() < .35), ...(L.oldpine || []).filter(() => Math.random() < .5)]) for (let k = 0; k < 3; k++) { const a = k * 2.1 + rand(-.3, .3);
    put('ivy', t.x + Math.cos(a) * .22, t.z + Math.sin(a) * .22, ivy[0] ? rand(1.1, 2) / ivy[0].w : 1, { ry: -a + PI / 2, y: rand(0, .8), sy: rand(1.2, 2) }); }
  wl_scatter(pine, L.pine || [], { vis: 70, shadow: true, saum: true }); wl_scatter(trees, L.trees || [], { vis: 62, shadow: true, saum: true }); wl_scatter(oldpine, L.oldpine || [], { vis: 56, shadow: true });
  wl_scatter(bushes, L.bushes || [], { cell: 32, vis: 44, noCol: 'soft' }); wl_scatter(stumpR, L.stumpR || [], { vis: 36 }); wl_scatter(stumpM, L.stumpM || [], { vis: 38 }); wl_scatter(rocks, L.rocks || [], { vis: 48, shadow: true });
  wl_scatter(ivylog, L.ivylog || [], { vis: 42, shadow: true }); wl_scatter(fallen, L.fallen || [], { vis: 42, shadow: true }); wl_scatter(branches, L.branches || [], { cell: 40, vis: 26, noCol: true });
  wl_scatter(leaves, L.leaves || [], { cell: 40, vis: 30, noCol: true }); wl_scatter(leafpile, L.leafpile || [], { cell: 40, vis: 28, noCol: true }); wl_scatter(moss, L.moss || [], { cell: 40, vis: 26, noCol: true });
  wl_scatter(mossstick, L.mossstick || [], { cell: 40, vis: 26, noCol: true }); wl_scatter(clover, L.clover || [], { cell: 40, vis: 24, noCol: true }); wl_scatter(grass, L.grass || [], { cell: 40, vis: 30, noCol: true });
  wl_scatter(tallgrass, L.tallgrass || [], { cell: 40, vis: 28, noCol: true }); wl_scatter(mush, L.mush || [], { cell: 40, vis: 18, noCol: true }); wl_scatter(ivy, L.ivy || [], { cell: 40, vis: 30, noCol: true });
  // Stämme: schmale Kollision (Kronen sind durchlässig)
  if (typeof addCol === 'function') for (const [k, r] of [['pine', .22], ['trees', .2], ['oldpine', .3]]) for (const t of L[k] || []) addCol(t.x - r, t.x + r, t.z - r, t.z + r);
  for (const k in L) WL.n[k] = L[k].length;
  WL.treePts = (L.trees || []).map(t => [t.x, t.z]); // Laubbäume: hier fallen Blätter (umwelt.js)
  for (const c of WL.chunks) for (const m of c.meshes) m.visible = false;
  WL.ready = true;
}]);
// ---------------------------------------------------------------- Klang: Wind in den Kronen und Leben im Unterholz
function wl_rustle(x, z, v = 1) { if (!Audio.ctx) return; if (Audio.busch) return Audio.busch(x, z, v * .7); const d = Audio.at(x, .5, z, 3);
  for (let i = 0, n = 3 + Math.floor(rand(0, 4)); i < n; i++) { const s = Audio.noise(false), bp = Audio.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(1600, 4200); bp.Q.value = .9; s.connect(bp); Audio.env(bp, rand(.05, .12) * v, .01, rand(.05, .16), i * rand(.05, .13), d); s.stop(Audio.ctx.currentTime + 1.6); } }
// Erste Vögel vor dem Morgengrauen (Kapitel 6, Epilog): ein Rotkehlchen – kurze, abfallende Pfeiftöne mit Trillerende; zweite Stimme: Amsel, tiefer, flötend
function wl_bird(x, y, z, amsel) { const A = Audio; if (!A.ctx) return; const d = A.at(x, y, z, 10), c = A.ctx, t0 = c.currentTime + .05;
  const n = amsel ? 4 + Math.floor(rand(0, 3)) : 5 + Math.floor(rand(0, 5)); let t = t0;
  for (let i = 0; i < n; i++) { const o = c.createOscillator(), g = c.createGain(), f0 = amsel ? rand(1600, 2400) : rand(3200, 6200), f1 = f0 * (amsel ? rand(.82, 1.15) : rand(.7, 1.25)), dur = amsel ? rand(.12, .26) : rand(.05, .14);
    o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); if (!amsel && i === n - 1) { o.frequency.setValueAtTime(f1, t + dur * .5); for (let k = 0; k < 6; k++) o.frequency.setValueAtTime(k % 2 ? f1 * 1.18 : f1, t + dur * .5 + k * .025); }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amsel ? .05 : .035, t + .012); g.gain.exponentialRampToValueAtTime(.0005, t + dur + (i === n - 1 && !amsel ? .15 : 0)); o.connect(g); g.connect(d); o.start(t); o.stop(t + dur + .2);
    t += dur + (amsel ? rand(.06, .16) : rand(.03, .09)); } }
// Windbett in den Kronen – über Audio.hushG: bei plötzlicher Stille und an den Fraßstellen bleibt nur ein sehr leiser hoher Wind
function wl_bed(on, k) {
  if (!Audio.ctx) return; const A = Audio.ctx;
  if (on && !WL.bed) { const g = A.createGain(); g.gain.value = 0; g.connect(Audio.hushG || Audio.master); const s = Audio.noise(true), lp = A.createBiquadFilter(), bp = A.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = .5;
    s.connect(bp); bp.connect(lp); lp.connect(g); WL.bed = s; WL.bedG = g; WL.bedF = lp; }
  if (WL.bed) { const t = A.currentTime, want = on ? (.05 + .07 * k) * (.55 + WL.gust * .9) : 0; WL.bedG.gain.setTargetAtTime(want, t, .8); WL.bedF.frequency.setTargetAtTime(700 + WL.gust * 1100, t, .6);
    if (!on && WL.bedG.gain.value < .002) { try { WL.bed.stop(); } catch (e) {} WL.bed = null; } }
}
// Ein Ereignis im Wald – spärlich und glaubwürdig für eine Novembernacht (keine Grillen, keine Frösche). Die Regie wählt nur Familien, die gerade dran sein dürfen;
// je tiefer im Wald (k), desto seltener das Kleinleben und desto eher Fernes (Kauz, Reh, Heulen).
function wl_event(k) {
  const P = player.pos, a = rand(0, 6.28), far = (d0, d1) => { const d = rand(d0, d1); return [P.x + Math.cos(a) * d, P.z + Math.sin(a) * d]; }, W = Audio, near = 1.2 - k * .6;
  const L = [
    [2.4 * near, 'rustle', () => { const [x, z] = far(5, 14); wl_rustle(x, z, rand(.6, 1)); if (Math.random() < .3) setTimeout(() => wl_rustle(x + rand(-1, 1), z + rand(-1, 1), .6), rand(300, 800)); }], // Wind im Laub, ein Tier
    [1.2 * near, 'critter', () => { const [x, z] = far(6, 14); wl_rustle(x, z, .7); for (let i = 0; i < 3; i++) setTimeout(() => W.play(W.pick('stepG1', 'stepG2', 'stepG3'), { gain: .05, rate: rand(1.9, 2.3), x: x + i * .4, y: 0, z: z + i * .3, ref: 2 }), 120 + i * rand(80, 130)); }], // Maus/Igel huscht davon
    [1.4, 'twig', () => { const [x, z] = far(7, 18); W.twig(x, z); }], // Ast knackt – irgendwo steht etwas
    [.6, 'branch', () => { const [x, z] = far(12, 26); W.play(W.pick('woodFall1', 'woodFall2'), { gain: rand(.08, .13), rate: rand(.85, 1.15), lp: 3000, x, y: 3, z, ref: 5 }); setTimeout(() => wl_rustle(x, z, .8), 350); }], // Totholz fällt
    [1.3, 'treeCreak', () => W.treeCreak(...far(9, 25))],
    [.9, 'drip', () => { const [x, z] = far(3, 8); for (let i = 0, n = 2 + Math.floor(rand(0, 3)); i < n; i++) setTimeout(() => W.drip(x + rand(-.5, .5), rand(1.8, 3), z + rand(-.5, .5)), i * rand(400, 1200)); }], // es tropft von den Kronen
    [.5, 'flap', () => { const [x, z] = far(8, 16); W.flap(x, rand(4, 7), z); }], // ein Vogel, aufgeschreckt
    [1.4, 'owl', () => W.owlPair ? W.owlPair(...far(30, 60)) : W.owl(...far(30, 60))], // Waldkauz: im Herbst die Reviernacht
    [.6 * k, 'deer', () => W.deerBark && W.deerBark(...far(40, 70))],
    [.4 * k, 'fox', () => W.fox && W.fox(...far(45, 80))]];
  if (k > .5 && typeof leben_howl === 'function' && !WL.morgen) L.push([.35, 'howl', () => { const [x, z] = far(70, 95); leben_howl(x, 1, z); }]);
  if (WL.morgen) { L.push([4, 'bird', () => { const [x, z] = far(12, 35); wl_bird(x, rand(5, 10), z); }]); L.push([2, 'bird2', () => { const [x, z] = far(25, 50); wl_bird(x, rand(6, 12), z, true); }]); } // erste Vögel (Kapitel 6, Morgen)
  if (typeof spannung_can !== 'function') return L[Math.floor(Math.random() * L.length)][2]();
  const ok = L.filter(e => e[0] > 0 && spannung_can(e[1], 'amb')); if (!ok.length) return;
  let r = Math.random() * ok.reduce((s, e) => s + e[0], 0); for (const e of ok) { r -= e[0]; if (r <= 0) { e[2](); spannung_did(e[1], 'amb'); return; } }
}
WORLD_TICK.push((dt, t) => {
  if (!WL.ready || !state.started || menu.attract) return;
  // Kapitel 1–5: gesperrt (wald_frei, wald.js) – kein Wind, kein Klang; nur die Kiefern des Waldsaums als Kulisse am Nordrand, ohne Schatten
  if (typeof wald_frei === 'function' && !wald_frei()) { if (!WL.off) { WL.off = true; WL.saum = null; for (const c of WL.chunks) for (const m of c.meshes) m.visible = false; WL.inForest = 0; wl_bed(false, 0); }
    WL.saumT -= dt; if (WL.saumT < 0) { WL.saumT = .5; const on = typeof wald_saumAn === 'function' && wald_saumAn(); if (on !== WL.saum) { WL.saum = on; for (const c of WL.chunks) if (c.saum) for (const m of c.meshes) { m.visible = on; m.castShadow = false; } } }
    return; }
  if (WL.off) { WL.off = false; WL.chunkT = 0; }
  const P = player.pos, cam = camera.position;
  // Blöcke nach Abstand
  WL.chunkT -= dt; if (WL.chunkT < 0) { WL.chunkT = .3; const near = P.z > 90 && P.x > WALD.x0 - 30 && P.x < WALD.x1 + 30 && state.zone !== 'canal' && !state.inBasement;
    for (const c of WL.chunks) { const d = Math.hypot(c.x - cam.x, c.z - cam.z), v = near && d < c.vis; for (const m of c.meshes) { if (m.visible !== v) m.visible = v; if (c.sh) m.castShadow = d < c.sh; } } }
  // Wind: Böen alle paar Sekunden, Gras und Kronen folgen
  // Wind: im Wald öfter Böen – über den gemeinsamen Windzustand der Basis (hörbar und sichtbar zugleich)
  WL.gustT -= dt; if (WL.gustT < 0) { WL.gustT = rand(7, 18); WL.gustD = rand(3, 6); if (wl_in(P.x, P.z)) { if (Audio.ctx) Audio.gust(WL.gustD); windStoss(WL.gustD); } }
  WL.gust = gust;
  // Klang im Wald
  const inF = wl_in(P.x, P.z) && state.zone !== 'canal', k = typeof tief_in === 'function' && tief_in(P.x, P.z) ? .6 + (typeof tief_S !== 'undefined' ? tief_S.k * .4 : 0) : .35;
  WL.inForest += ((inF ? 1 : 0) - WL.inForest) * Math.min(1, dt * .8); wl_bed(WL.inForest > .02 && typeof klang_wind !== 'function', k * WL.inForest); // Wind in den Kronen: Aufnahme in klang.js (klang_wind), sonst Rauschen
  if (!inF || state.talking || ui.overlay) return;
  const spd = Math.hypot(vel.x, vel.z); WL.sndT -= dt * (spd < .3 ? 1.3 : 1); if (WL.sndT < 0) { WL.sndT = rand(6, 13) * (1.1 - k * .2); wl_event(k); } // Budget und Abstände: Regie (spannung)
});
window.__wl = { S: WL, event: k => wl_event(k || .6) }; // Testzugriff
