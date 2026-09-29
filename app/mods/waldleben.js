// =====================================================================  WALDLEBEN (Modul „waldleben“): der Wald ist bewachsen, bewegt sich und klingt
// Forbidden Dustwoods (WALD) und tiefer Wald (TIEF) bekommen zwischen den toten Bäumen lebendes Grün und Bodenleben, alles echte Scans (Fab, CC-BY,
// siehe CREDITS.md): Kiefern (Big bubble), Laubbäume und Büsche (Nicholas 3D), alte Kiefernstrünke (Drakery), bemooste und faulende Stümpfe
// (Indy Sarlet, Ewan Lejkowski), Moosfelsen (Lassi Kaukonen), efeubewachsene und umgestürzte Stämme (matousekfoto, PersScans), Äste (Arkify3d),
// Laub (Zygomir, matousekfoto), Moos (Zygomir), Klee (Studio-Lab), Gras (Nicholas 3D, Charlie catling), Pilze (EFX).
// Verhalten: Wind lässt Gras, Büsche und Kronen schwingen (Böen stärker, synchron zum Windgeräusch), Pflanzen weichen dem Spieler aus, Büsche
// bremsen und rascheln (Grundspiel: weiche Körper). Klang: Windbett in den Kronen, Laubrascheln, Zweige, fallende Äste, Kiefernzapfen,
// kleine Tiere im Unterholz, Flügelschlag, Tropfen, Käuzchen, fernes Heulen, Frösche am Weiher.
const WL = { ready: false, chunks: [], chunkT: 0, uWind: { value: 0 }, uAmp: { value: 1 }, uPl: { value: new THREE.Vector3() }, gust: 0, gustT: 8, sndT: 3, bed: null, bedG: null, inForest: 0, n: {} };
function wl_in(x, z) { return (typeof wald_in === 'function' && wald_in(x, z)) || (typeof tief_in === 'function' && tief_in(x, z)); }
// Platz frei? (Wege, Hütten, Rätselorte bleiben frei; r = Abstand zum Weg)
function wl_free(x, z, r = 1.6) {
  if (typeof tief_in === 'function' && tief_in(x, z)) return tief_free(x, z, r);
  if (typeof wald_in === 'function' && wald_in(x, z)) return wald_free(x, z) && wald_pathDist(x, z) > r;
  return false;
}
// Wind + Ausweichen: Schwingen nach Höhe im Modell (h = Modellhöhe), Weg vom Spieler (push)
function wl_wind(mat, amp, h, push) {
  if (mat.userData.wl) return mat; mat.userData.wl = true; const prev = mat.onBeforeCompile;
  const uH = { value: h }, uA = { value: amp }, uP = { value: push ? 1 : 0 };
  mat.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r); sh.uniforms.uWind = WL.uWind; sh.uniforms.uAmp = WL.uAmp; sh.uniforms.uPl = WL.uPl; sh.uniforms.uWH = uH; sh.uniforms.uWA = uA; sh.uniforms.uWP = uP;
    sh.vertexShader = 'uniform float uWind, uAmp, uWH, uWA, uWP; uniform vec3 uPl;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      {
        float hk = clamp(position.y / uWH, 0., 1.); hk *= hk;
        #ifdef USE_INSTANCING
          mat4 wm = modelMatrix * instanceMatrix;
        #else
          mat4 wm = modelMatrix;
        #endif
        vec4 wp0 = wm * vec4(position, 1.);
        float ph = wp0.x * .21 + wp0.z * .17;
        vec2 sway = vec2(sin(uWind * 1.3 + ph) + .45 * sin(uWind * 3.1 + ph * 2.3), cos(uWind * 1.1 + ph * 1.3) * .6) * uWA * uAmp * hk;
        vec2 dp = wp0.xz - uPl.xz; float dd = length(dp);
        float pk = uWP * (1. - smoothstep(.25, 1.5, dd)) * .45 * hk;
        vec2 off = sway + (dd > .001 ? dp / dd : vec2(0.)) * pk;
        transformed += inverse(mat3(wm)) * vec3(off.x, 0., off.y);
      }`); };
  mat.customProgramCacheKey = () => 'wl_wind'; mat.needsUpdate = true; return mat;
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
function wl_scatter(A, list, { vis = 40, shadow = false, noCol = false, cell = 24, y = 0 } = {}) {
  if (!A || !list.length) return; const byG = new Map();
  for (const L of list) { const gi = L.g ?? 0; if (!byG.has(gi)) byG.set(gi, []); byG.get(gi).push(L); }
  for (const [gi, arr] of byG) { const G = A[gi % A.length]; if (!G) continue; const cells = new Map();
    for (const L of arr) { const k = Math.floor(L.x / cell) + ',' + Math.floor(L.z / cell); let c = cells.get(k); if (!c) cells.set(k, c = { x: 0, z: 0, n: 0, M: [] }); c.x += L.x; c.z += L.z; c.n++;
      c.M.push(new THREE.Matrix4().compose(new THREE.Vector3(L.x, (L.y ?? y), L.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(L.tx || 0, L.ry, L.tz || 0)), new THREE.Vector3(L.s * (L.sx || 1), L.s * (L.sy || 1), L.s * (L.sx || 1)))); }
    for (const c of cells.values()) { const meshes = msInst(G.parts, c.M, { shadow }); for (const m of meshes) { m.frustumCulled = true; if (noCol === true || (noCol !== 'soft' && m.material.alphaTest > 0)) m.userData.noCol = true; }
      WL.chunks.push({ x: c.x / c.n, z: c.z / c.n, meshes, vis, sh: shadow ? 22 : 0 }); } }
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
  wl_scatter(pine, L.pine || [], { vis: 70, shadow: true }); wl_scatter(trees, L.trees || [], { vis: 62, shadow: true }); wl_scatter(oldpine, L.oldpine || [], { vis: 56, shadow: true });
  wl_scatter(bushes, L.bushes || [], { cell: 32, vis: 44, noCol: 'soft' }); wl_scatter(stumpR, L.stumpR || [], { vis: 36 }); wl_scatter(stumpM, L.stumpM || [], { vis: 38 }); wl_scatter(rocks, L.rocks || [], { vis: 48, shadow: true });
  wl_scatter(ivylog, L.ivylog || [], { vis: 42, shadow: true }); wl_scatter(fallen, L.fallen || [], { vis: 42, shadow: true }); wl_scatter(branches, L.branches || [], { cell: 40, vis: 26, noCol: true });
  wl_scatter(leaves, L.leaves || [], { cell: 40, vis: 30, noCol: true }); wl_scatter(leafpile, L.leafpile || [], { cell: 40, vis: 28, noCol: true }); wl_scatter(moss, L.moss || [], { cell: 40, vis: 26, noCol: true });
  wl_scatter(mossstick, L.mossstick || [], { cell: 40, vis: 26, noCol: true }); wl_scatter(clover, L.clover || [], { cell: 40, vis: 24, noCol: true }); wl_scatter(grass, L.grass || [], { cell: 40, vis: 30, noCol: true });
  wl_scatter(tallgrass, L.tallgrass || [], { cell: 40, vis: 28, noCol: true }); wl_scatter(mush, L.mush || [], { cell: 40, vis: 18, noCol: true }); wl_scatter(ivy, L.ivy || [], { cell: 40, vis: 30, noCol: true });
  // Stämme: schmale Kollision (Kronen sind durchlässig)
  if (typeof addCol === 'function') for (const [k, r] of [['pine', .22], ['trees', .2], ['oldpine', .3]]) for (const t of L[k] || []) addCol(t.x - r, t.x + r, t.z - r, t.z + r);
  for (const k in L) WL.n[k] = L[k].length;
  for (const c of WL.chunks) for (const m of c.meshes) m.visible = false;
  WL.ready = true;
}]);
// ---------------------------------------------------------------- Klang: Wind in den Kronen und Leben im Unterholz
function wl_rustle(x, z, v = 1) { if (!Audio.ctx) return; const d = Audio.at(x, .5, z, 3);
  for (let i = 0, n = 3 + Math.floor(rand(0, 4)); i < n; i++) { const s = Audio.noise(false), bp = Audio.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(1600, 4200); bp.Q.value = .9; s.connect(bp); Audio.env(bp, rand(.05, .12) * v, .01, rand(.05, .16), i * rand(.05, .13), d); s.stop(Audio.ctx.currentTime + 1.6); } }
function wl_croak(x, z) { if (!Audio.ctx) return; const d = Audio.at(x, .2, z, 4), t = Audio.ctx.currentTime;
  for (let k = 0; k < 3; k++) { const o = Audio.ctx.createOscillator(), g = Audio.ctx.createGain(), f = Audio.ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = rand(95, 130); f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 3;
    const t0 = t + k * .22; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.05, t0 + .02); g.gain.exponentialRampToValueAtTime(.001, t0 + .16); o.connect(f); f.connect(g); g.connect(d); o.start(t0); o.stop(t0 + .18); } }
function wl_bed(on, k) {
  if (!Audio.ctx) return; const A = Audio.ctx;
  if (on && !WL.bed) { const g = A.createGain(); g.gain.value = 0; g.connect(Audio.master); const s = Audio.noise(true), lp = A.createBiquadFilter(), bp = A.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = .5;
    s.connect(bp); bp.connect(lp); lp.connect(g); WL.bed = s; WL.bedG = g; WL.bedF = lp; }
  if (WL.bed) { const t = A.currentTime, want = on ? (.05 + .07 * k) * (.55 + WL.gust * .9) : 0; WL.bedG.gain.setTargetAtTime(want, t, .8); WL.bedF.frequency.setTargetAtTime(700 + WL.gust * 1100, t, .6);
    if (!on && WL.bedG.gain.value < .002) { try { WL.bed.stop(); } catch (e) {} WL.bed = null; } }
}
function wl_event(k) {
  const P = player.pos, a = rand(0, 6.28), far = (d0, d1) => { const d = rand(d0, d1); return [P.x + Math.cos(a) * d, P.z + Math.sin(a) * d]; }, r = Math.random();
  if (r < .2) { const [x, z] = far(4, 12); wl_rustle(x, z, 1); if (Math.random() < .4) setTimeout(() => wl_rustle(x + rand(-1, 1), z + rand(-1, 1), .7), rand(250, 700)); }
  else if (r < .3) { const [x, z] = far(5, 14); wl_rustle(x, z, .8); for (let i = 0; i < 4; i++) setTimeout(() => Audio.play(Audio.pick('stepG1', 'stepG2', 'stepG3'), { gain: .06, rate: rand(1.9, 2.3), x: x + i * .4, y: 0, z: z + i * .3, ref: 2 }), 120 + i * rand(70, 110)); }
  else if (r < .4) { const [x, z] = far(8, 22); Audio.play(Audio.pick('woodFall1', 'woodFall2'), { gain: .12, rate: rand(.9, 1.2), x, y: 3, z, ref: 5 }); setTimeout(() => wl_rustle(x, z, .9), 350); }
  else if (r < .5) { const [x, z] = far(4, 12); Audio.play(Audio.pick('woodHit1', 'woodHit3'), { gain: .05, rate: rand(1.8, 2.4), x, y: 2, z, ref: 2 }); setTimeout(() => Audio.play('woodHit2', { gain: .03, rate: 2.2, x, y: 0, z, ref: 2 }), rand(180, 320)); }
  else if (r < .6) { const [x, z] = far(6, 14); Audio.flap(x, rand(2, 5), z); wl_rustle(x, z, .6); }
  else if (r < .68) Audio.treeCreak(...far(8, 25));
  else if (r < .74) { const [x, z] = far(3, 9); Audio.drip(x, rand(1.5, 3), z); }
  else if (r < .8) Audio.owlPair ? Audio.owlPair(...far(25, 50)) : Audio.owl(...far(25, 50));
  else if (r < .84 && k > .5 && typeof leben_howl === 'function') { const [x, z] = far(60, 90); leben_howl(x, 1, z); }
  else if (r < .9 && typeof TIEF !== 'undefined' && Math.hypot(P.x - TIEF.pond.x, P.z - TIEF.pond.z) < 40) wl_croak(TIEF.pond.x + rand(-6, 6), TIEF.pond.z + rand(-5, 5));
  else if (r < .95) Audio.play('crickets', { gain: .05, rate: rand(.9, 1.05), dur: rand(1.5, 3), offset: rand(0, 5), x: P.x + rand(-15, 15), y: 0, z: P.z + rand(-15, 15), ref: 8 });
  else { const [x, z] = far(10, 20); wl_rustle(x, z, 1.3); setTimeout(() => wl_rustle(x + 2, z + 1, 1), 400); setTimeout(() => wl_rustle(x + 4, z + 2, .7), 800); }
}
WORLD_TICK.push((dt, t) => {
  if (!WL.ready || !state.started || menu.attract) return; const P = player.pos, cam = camera.position;
  // Blöcke nach Abstand
  WL.chunkT -= dt; if (WL.chunkT < 0) { WL.chunkT = .3; const near = P.z > 90 && P.x > WALD.x0 - 30 && P.x < WALD.x1 + 30 && state.zone !== 'canal' && !state.inBasement;
    for (const c of WL.chunks) { const d = Math.hypot(c.x - cam.x, c.z - cam.z), v = near && d < c.vis; for (const m of c.meshes) { if (m.visible !== v) m.visible = v; if (c.sh) m.castShadow = d < c.sh; } } }
  // Wind: Böen alle paar Sekunden, Gras und Kronen folgen
  WL.gustT -= dt; if (WL.gustT < 0) { WL.gustT = rand(7, 18); WL.gustA = rand(.6, 1.2); WL.gustD = rand(3, 6); WL.gustS = 0; if (wl_in(P.x, P.z) && Audio.ctx) Audio.gust(WL.gustD); }
  if (WL.gustS !== undefined && WL.gustS < WL.gustD) { WL.gustS += dt; WL.gust = Math.sin(Math.min(1, WL.gustS / WL.gustD) * PI) * WL.gustA; } else WL.gust += (0 - WL.gust) * Math.min(1, dt);
  WL.uWind.value += dt * (1 + WL.gust * 1.5); WL.uAmp.value = 1 + WL.gust * 1.6; WL.uPl.value.set(P.x, P.y, P.z);
  // Klang im Wald
  const inF = wl_in(P.x, P.z) && state.zone !== 'canal', k = typeof tief_in === 'function' && tief_in(P.x, P.z) ? .6 + (typeof tief_S !== 'undefined' ? tief_S.k * .4 : 0) : .35;
  WL.inForest += ((inF ? 1 : 0) - WL.inForest) * Math.min(1, dt * .8); wl_bed(WL.inForest > .02, k * WL.inForest);
  if (!inF || state.talking || ui.overlay) return;
  const spd = Math.hypot(vel.x, vel.z); WL.sndT -= dt * (spd < .3 ? 1.6 : 1); if (WL.sndT < 0) { WL.sndT = rand(2.2, 6) * (1.2 - k * .4); wl_event(k); }
});
window.__wl = { S: WL, event: k => wl_event(k || .6) }; // Testzugriff
