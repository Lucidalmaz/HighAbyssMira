// =====================================================================  GRÜN (Modul „gruen“): Böden, Pflanzen, Zäune, Grenzwald
// Fotografierte Böden (nasser Asphalt mit Flickstellen, Pfützen und Regenringen, Gehwegplatten mit Moos, verwilderter Rasen,
// Waldboden, Kies, Laub), gescannte Gräser und Sträucher statt gemalter Halme und Kugel-Hecken, Holzzäune und Gartentore als
// Modelle, Weidezaun und dichter toter Wald an der neuen Außengrenze (x −158…158, z −53…98).
const gruen_OUT = { x0: -158, x1: 158, z0: -53, z1: 98 };
// offene Gebiete (Ortskern + Erweiterungen der anderen Teams) – dort kein Wald, nur Wiese/Wildwuchs als Grundlage
const gruen_AREAS = [[-80, 80, -32.4, 32.4], [-80, 60, 32.4, 95], [80, 155, -40, 35], [-155, -80, -50, 45], [-148, -102, 45, 92]];
const gruen_CLEAR = { x: 114, z: 68, r: 8.5 }; // Lichtung im Nordost-Wald
const gruen_S = { lod: [], chunks: [], soft: new Map(), gravel: [], hedges: [], uT: { value: 0 }, cx: 1e9, cz: 1e9, cyaw: 0, rt: 0, step: -1, rust: 0, amb: 30, hedgeT: 40, found: new Set(), stats: {} };
const gruen_O = { x0: -182, z0: -78, cs: .5, nx: 728, nz: 400 }; gruen_O.a = new Uint8Array(gruen_O.nx * gruen_O.nz); // Belegung (0 frei, 1 Hecke/Zaun/Busch, 2 Weg/Fläche, 3 fest)
const gruen_R = new THREE.Group(); gruen_R.name = 'gruen';                          // alles Eigene hängt hier (schnelleres Vorübersetzen)

// ---- kleine Helfer
const gruen_h = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
function gruen_n(x, z) { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = gruen_h(ix, iz), b = gruen_h(ix + 1, iz), c = gruen_h(ix, iz + 1), d = gruen_h(ix + 1, iz + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function gruen_areaOf(x, z, m = 0) { for (let i = 0; i < gruen_AREAS.length; i++) { const [a, b, c, e] = gruen_AREAS[i]; if (x >= a - m && x <= b + m && z >= c - m && z <= e + m) return i; } return -1; }
function gruen_areaDist(x, z) { let d = 1e9; for (const [a, b, c, e] of gruen_AREAS) d = Math.min(d, Math.hypot(Math.max(a - x, 0, x - b), Math.max(c - z, 0, z - e))); return d; }
const gruen_dust = (x, z) => z > 99 && x > -44 && x < 114; // Forbidden Dustwoods (Modul wald): eigenes Waldgebiet nördlich des Spielplatzes
const gruen_dustGap = (x, z, m = 0) => Math.abs(z - 98) < 1 + m && x > 26 - m && x < 34 + m; // Lücke im Nordzaun
const gruen_inside = (x, z) => x > gruen_OUT.x0 && x < gruen_OUT.x1 && z > gruen_OUT.z0 && z < gruen_OUT.z1;
function gruen_fenceDist(x, z) { const O = gruen_OUT;
  let d = gruen_inside(x, z) ? Math.min(x - O.x0, O.x1 - x, z - O.z0, O.z1 - z) : Math.hypot(Math.max(O.x0 - x, 0, x - O.x1), Math.max(O.z0 - z, 0, z - O.z1));
  if (z < -32 && z > -53.5) d = Math.min(d, Math.abs(Math.abs(x) - 79.4));          // Waldblock Süd, seitlich
  if (Math.abs(x) < 79.8 && Math.abs(x) > 4.2) d = Math.min(d, Math.abs(z + 32.4));  // alter Südzaun
  if (z < -32 && z > -46) d = Math.min(d, Math.abs(Math.abs(x) - 4.6));              // Zäune an der Südstraße
  return d; }
function gruen_oi(x, z) { const i = Math.floor((x - gruen_O.x0) / gruen_O.cs), j = Math.floor((z - gruen_O.z0) / gruen_O.cs); return i < 0 || j < 0 || i >= gruen_O.nx || j >= gruen_O.nz ? -1 : j * gruen_O.nx + i; }
function gruen_occ(x, z) { const k = gruen_oi(x, z); return k < 0 ? 255 : gruen_O.a[k]; }
function gruen_mark(x0, x1, z0, z1, v) { const O = gruen_O, cs = O.cs;
  const i0 = Math.max(0, Math.floor((x0 - O.x0) / cs)), i1 = Math.min(O.nx - 1, Math.floor((x1 - O.x0) / cs)), j0 = Math.max(0, Math.floor((z0 - O.z0) / cs)), j1 = Math.min(O.nz - 1, Math.floor((z1 - O.z0) / cs));
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * O.nx + i; if (O.a[k] < v) O.a[k] = v; } }
function gruen_markDisc(x, z, r, v) { for (let a = -r; a <= r; a += .25) for (let b = -r; b <= r; b += .25) if (a * a + b * b <= r * r) { const k = gruen_oi(x + a, z + b); if (k >= 0 && gruen_O.a[k] < v) gruen_O.a[k] = v; } }
function gruen_tex(p, srgb, rx = 1, ry = rx) { const t = MSL.tl.load('assets/' + p); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(rx, ry); return t; }
const gruen_m4 = (x, y, z, ry = 0, sx = 1, sy = sx, sz = sx, tx = 0, tz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(tx, ry, tz)), new THREE.Vector3(sx, sy, sz));
const gruen_add = o => { o.traverse(m => { m.userData.gruen = true; }); gruen_R.add(o); return o; };

// Weiche, unregelmäßige Masken für Laub-, Schlamm- und Pfützen-Flecken (nur die Form; sichtbar ist immer eine Scan-Oberfläche)
function gruen_mask(kind) {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d', { willReadFrequently: true });
  x.fillStyle = '#000'; x.fillRect(0, 0, S, S);
  const blob = (px, py, r, hard) => { const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, '#fff'); g.addColorStop(hard, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); };
  if (kind === 'disc') blob(S / 2, S / 2, 118, .8);
  else for (let i = 0, n = kind === 'pud' ? 6 : 12; i < n; i++) { const sp = kind === 'pud' ? 42 : 60; blob(S / 2 + rand(-sp, sp), S / 2 + rand(-sp, sp) * .7, rand(kind === 'pud' ? 30 : 34, kind === 'pud' ? 60 : 74), kind === 'pud' ? .8 : .45); }
  const img = x.getImageData(0, 0, S, S), d = img.data, o = rand(0, 99);
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const k = (j * S + i) * 4, e = Math.min(1, Math.min(i, j, S - 1 - i, S - 1 - j) / 22), nn = gruen_n(i / 9 + o, j / 9) * .6 + gruen_n(i / 3.1, j / 3.1 + o) * .4;
    let v = d[k] / 255; v = kind === 'pud' ? (v > .55 + (nn - .5) * .5 ? 1 : v * .35) : kind === 'disc' ? Math.min(1, v * (.7 + nn * .6)) : v * (.5 + nn);
    v = Math.max(0, Math.min(1, v)) * e; d[k] = d[k + 1] = d[k + 2] = v * 255; d[k + 3] = 255; }
  x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; }

// ---- Shader: EIN Programm je Materialfamilie (Böden, Pflanzen) – Unterschiede nur über Uniforms, damit das Laden schnell bleibt
const gruen_GLSL = `
varying vec3 gW;
uniform float gT;
float gH(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float gN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(gH(i), gH(i + vec2(1., 0.)), f.x), mix(gH(i + vec2(0., 1.)), gH(i + vec2(1., 1.)), f.x), f.y); }
float gF(vec2 p){ return gN(p) * .55 + gN(p * 2.07 + 7.1) * .3 + gN(p * 4.13 + 3.3) * .15; }
vec2 gRip(vec2 p, float t){ vec2 acc = vec2(0.);
  for (int k = 0; k < 3; k++) { float fk = float(k); vec2 q = p * (1.6 + fk * .85) + fk * 17.3; vec2 i = floor(q), f = fract(q);
    float h = gH(i + fk * 5.1); vec2 c = vec2(gH(i + 3.7), gH(i + 9.2)) * .5 + .25; float ph = fract(t * (.55 + h * .5) + h * 7.);
    vec2 d = f - c; float r = length(d) + 1e-4, R = ph * .45, w = smoothstep(.1, 0., abs(r - R)) * (1. - ph);
    acc += d / r * sin((r - R) * 60.) * w; }
  return acc; }
float gPud = 0., gWet = 0.;
// Nasse Straße: Natrium-Laternen spiegeln sich als lange, weiche Streifen (die zehn nächsten Laternen, dieselben wie der Nebelschein; Spiegelpunkt zwischen Kamera und Laternenfuß)
uniform vec4 gLamps[10];
vec3 gStreak(vec3 P, float wet, float pud){ vec3 v = normalize(P - cameraPosition); float rEl = asin(clamp(-v.y, 0., 1.)); vec2 rh = normalize(v.xz + 1e-5), acc = vec2(0.);
  float sa = mix(.03, .011, pud), se = mix(.3, .1, pud);
  for (int i = 0; i < 10; i++){ vec4 L = gLamps[i]; if (L.w < .02) continue; vec2 lh = L.xz - P.xz; float dh = length(lh); if (dh < .5) continue; lh /= dh;
    float c = dot(rh, lh); if (c < .5) continue; float daz = rh.x * lh.y - rh.y * lh.x, del = atan(5.1 - P.y, dh) - rEl; // Spiegelung: seitlich eng, in der Höhe weit gezogen (Rauheit) → senkrechter Streifen unter der Laterne
    acc.x += L.w * exp(-daz * daz / (sa * sa) - del * del / (se * se)) * smoothstep(55., 20., dh); }
  return vec3(1., .56, .22) * acc.x * mix(.08, .4, wet) * (1. + 1.5 * pud); }
`;
const gruen_VERT = s => 'varying vec3 gW;\n' + s.replace('#include <begin_vertex>', `#include <begin_vertex>
  #ifdef USE_INSTANCING
    gW = (modelMatrix * instanceMatrix * vec4(transformed, 1.)).xyz;
  #else
    gW = (modelMatrix * vec4(transformed, 1.)).xyz;
  #endif`);
const gruen_RIP = `if (gPud > .002) { vec2 rp = gRip(gW.xz, gT) * gRipK; vec3 wn = normalize((viewMatrix * vec4(normalize(vec3(rp.x, 1., rp.y)), 0.)).xyz); normal = normalize(mix(normal, wn, gPud)); }`;
// Böden: 0 Rasen/Waldboden, 1 Asphalt, 2 Gehweg, 3 Kies
function gruen_surf(mat, mode, texA, texB) {
  const open = gruen_AREAS.map(([a, b, c, e]) => `gRect(q, vec4(${a.toFixed(1)}, ${b.toFixed(1)}, ${c.toFixed(1)}, ${e.toFixed(1)}))`).reduce((s, r) => s ? `max(${s}, ${r})` : r, '');
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { gT: gruen_S.uT, gMode: { value: mode }, gTexA: { value: texA }, gTexB: { value: texB }, gRipK: { value: .3 }, gLamps: fogUniforms.lamps });
    sh.vertexShader = gruen_VERT(sh.vertexShader);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
${gruen_GLSL}
uniform float gMode, gRipK; uniform sampler2D gTexA, gTexB;
float gRect(vec2 p, vec4 r){ vec2 d = max(max(vec2(r.x - p.x, r.z - p.y), vec2(p.x - r.y, p.y - r.w)), 0.); return 1. - smoothstep(0., 5., length(d)); }`)
    .replace('#include <map_fragment>', `
      vec2 wp = gW.xz; vec4 tA = texture2D(map, vMapUv);
      if (gMode < .5) {            // Rasen / Waldboden
        vec4 tB = texture2D(map, mat2(.8, -.6, .6, .8) * wp * .29 + .31);
        float n1 = gF(wp * .031), n2 = gN(wp * .21 + 11.3), n3 = gN(wp * .57 + 4.1);
        vec3 lawn = mix(tA.rgb, tB.rgb, smoothstep(.3, .7, n2) * .6);
        float lum = dot(lawn, vec3(.3, .59, .11));
        lawn = mix(lawn, lum * vec3(1.12, .98, .6), smoothstep(.38, .78, n1) * .65);
        lawn *= mix(.6, 1.05, smoothstep(.15, .85, gN(wp * .083 + 2.7)));
        vec3 lv = texture2D(gTexA, wp * .5).rgb, fl = texture2D(gTexB, wp * .45).rgb;
        vec2 q = wp + (vec2(n2, n3) - .5) * 7.;
        float fm = 1. - ${open};
        float lp = fm < .99 ? smoothstep(.6, .8, gF(wp * .11 + 21.)) * (1. - fm) : 0.;
        vec3 col = mix(lawn, lv * .9, lp * .75);
        col = mix(col, mix(fl * 1.9, lv * 1.8, smoothstep(.3, .7, gN(wp * .19 + 5.))), fm);
        diffuseColor.rgb *= col;
        gWet = smoothstep(.62, .82, gF(wp * .07 + 40.)) * .45;
      } else {
        diffuseColor *= tA;
        if (gMode < 1.5) {          // Asphalt: Flickstellen, nasse Senken, Pfützen
          vec2 pc = floor(vec2(wp.x / 3.3, wp.y / 1.9 + floor(wp.x / 3.3) * .37));
          diffuseColor.rgb = mix(diffuseColor.rgb, texture2D(gTexA, wp * .5).rgb * diffuse * .75, step(.9, gH(pc + 71.)) * .8);
          float pn = gF(wp * .15 + 3.1); gPud = smoothstep(.62, .655, pn); gWet = smoothstep(.5, .62, pn);
          diffuseColor.rgb *= mix(.8, 1.12, gN(wp * .05)) * mix(1., .68, gWet);
        } else if (gMode < 2.5) {   // Gehweg: nasse Flecken
          gWet = smoothstep(.45, .72, gF(wp * .22 + 9.));
          diffuseColor.rgb *= mix(1., .6, gWet) * mix(.84, 1.08, gN(wp * .09));
        } else {                    // Kies
          gWet = smoothstep(.4, .7, gF(wp * .35 + 2.));
          diffuseColor.rgb *= mix(1., .55, gWet) * mix(.8, 1.05, gN(wp * .6));
        }
      }`)
    .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(gMode < .5 ? 1. : roughnessFactor * (gMode < 1.5 ? .75 : .9), roughnessFactor * .42, gWet); roughnessFactor = mix(roughnessFactor, .1, gPud);')
    .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + gruen_RIP)
    .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n if (gMode > .5 && gMode < 2.5) totalEmissiveRadiance += gStreak(gW, gWet * (gMode < 1.5 ? 1. : .6) + .35, gPud);');
  };
  mat.customProgramCacheKey = () => 'gruenSurf'; mat.needsUpdate = true; return mat;
}
// Pflanzen: Wind (Stärke als Uniform, damit Gras, Sträucher und Hecken ein Programm teilen) – gemeinsamer Windzustand der Basis (windVert:
// geschichtet, Böenfronten, Blattflattern) und Ausweichen vor Luke mit gedämpftem Zurückfedern
function gruen_wind(mat, amt) {
  mat.onBeforeCompile = sh => { sh.uniforms.gAmt = { value: amt }; windVert(sh, 'max(position.y, 0.) * max(position.y, 0.) * gAmt', '.3', '.34'); sh.vertexShader = 'uniform float gAmt;\n' + sh.vertexShader; };
  mat.customProgramCacheKey = () => 'gruenWind2'; mat.needsUpdate = true; return mat;
}

// ---- Dynamische Instanzen mit Detailstufen (fein → grob → gescannte Bildkarte → weg) und Sichtkegel
// variants[v] = [stufe0Teile, stufe1Teile, …]; o.d = Grenzabstände je Stufe
function gruen_lodSet(name, variants, o = {}) { const S = { name, variants, d2: o.d.map(d => d * d), thin2: (o.thin ?? 1e4) ** 2, shadow: o.shadow || [], items: [], buckets: new Map(), meshes: [] }; gruen_S.lod.push(S); return S; }
function gruen_lodAdd(S, v, x, y, z, ry, s, sy = s, tilt = 0, col = null, sxz = 1) {
  const m = gruen_m4(x, y, z, ry, s * sxz, sy, s * sxz, rand(-tilt, tilt), rand(-tilt, tilt)), it = { v, x, z, e: Float32Array.from(m.elements), c: col || [1, 1, 1], thin: Math.random() < .5, s: Math.max(Math.abs(s * sxz), Math.abs(sy)) };
  S.items.push(it); const k = (Math.floor(x / 16) + 60) * 1000 + Math.floor(z / 16) + 60; let B = S.buckets.get(k); if (!B) S.buckets.set(k, B = []); B.push(it); return it; }
function gruen_lodBuild(S) {
  const cnt = S.variants.map(() => 0); for (const it of S.items) cnt[it.v]++;
  S.meshes = S.variants.map((V, v) => V.map((parts, l) => parts.map(p => { const n = Math.max(1, cnt[v]), im = new THREE.InstancedMesh(p.geo, p.mat, n);
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3).fill(1), 3); im.instanceColor.setUsage(THREE.DynamicDrawUsage);
    im.count = 0; im.visible = false; im.castShadow = !!S.shadow[l]; im.receiveShadow = true; im.userData.noCol = true;
    // 08.10. (Leistung): eigene, laufend nachgeführte Hüllkugel über die gerade belegten Instanzen → Sichtprüfung im Bild UND in jedem Schattenbild (Taschenlampe,
    // Laternen): liegt alles einer Gruppe außerhalb, entfällt ihr Zeichenaufruf. Großzügig (Wind/Ausweichen +1,5 m) – nie fehlt eine sichtbare Pflanze.
    // noCull: nicht in die Instanz-Auslese der Basis (sie würde die Instanzen umschreiben).
    im.frustumCulled = true; im.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5); im.userData.noCull = true; if (!p.geo.boundingSphere) p.geo.computeBoundingSphere();
    im.userData.gR = p.geo.boundingSphere.center.length() + p.geo.boundingSphere.radius; gruen_add(im); return im; })));
  gruen_S.stats[S.name] = S.items.length; }
function gruen_lodRefresh(S, cx, cz, fx, fz) {
  const n = S.meshes.map(L => L.map(() => 0)), bb = S.meshes.map(L => L.map(() => [1e9, -1e9, 1e9, -1e9, 1e9, -1e9, 0])), D = S.d2, last = D[D.length - 1], r = Math.ceil(Math.sqrt(last) / 16), bx = Math.floor(cx / 16), bz = Math.floor(cz / 16);
  for (let i = bx - r; i <= bx + r; i++) for (let j = bz - r; j <= bz + r; j++) {
    const B = S.buckets.get((i + 60) * 1000 + j + 60); if (!B) continue;
    for (const it of B) { const dx = it.x - cx, dz = it.z - cz, d2 = dx * dx + dz * dz; if (d2 > last || (it.thin && d2 > S.thin2)) continue;
      if (d2 > 9 && dx * fx + dz * fz < -.42 * Math.sqrt(d2)) continue;                 // hinter der Kamera
      let l = 0; while (l < D.length - 1 && d2 > D[l]) l++; const L = S.meshes[it.v][l]; if (!L || !L.length) continue;
      const k = n[it.v][l]++, q = bb[it.v][l], e = it.e, y = e[13];
      if (it.x < q[0]) q[0] = it.x; if (it.x > q[1]) q[1] = it.x; if (y < q[2]) q[2] = y; if (y > q[3]) q[3] = y; if (it.z < q[4]) q[4] = it.z; if (it.z > q[5]) q[5] = it.z; if (it.s > q[6]) q[6] = it.s;
      for (const im of L) { im.instanceMatrix.array.set(it.e, k * 16); const ca = im.instanceColor.array; ca[k * 3] = it.c[0]; ca[k * 3 + 1] = it.c[1]; ca[k * 3 + 2] = it.c[2]; } } }
  S.meshes.forEach((L, v) => L.forEach((parts, l) => parts.forEach(im => { const c = n[v][l]; im.count = c; im.visible = c > 0; if (!c) return;
    const q = bb[v][l], bs = im.boundingSphere; if (bs) { bs.center.set((q[0] + q[1]) / 2, (q[2] + q[3]) / 2, (q[4] + q[5]) / 2); bs.radius = Math.hypot(q[1] - q[0], q[3] - q[2], q[5] - q[4]) / 2 + q[6] * (im.userData.gR || 0) + 1.5; }
    im.instanceMatrix.clearUpdateRanges(); im.instanceMatrix.addUpdateRange(0, c * 16); im.instanceMatrix.needsUpdate = true;
    im.instanceColor.clearUpdateRanges(); im.instanceColor.addUpdateRange(0, c * 3); im.instanceColor.needsUpdate = true; })));
}
// all = sofort alles (Laden, Tests); sonst werden die Pflanzen-Sätze auf die folgenden Bilder verteilt (keine Ruckler)
function gruen_refreshAll(all = true) { const cx = camera.position.x, cz = camera.position.z, f = new THREE.Vector3(); camera.getWorldDirection(f); const l = Math.hypot(f.x, f.z) || 1;
  gruen_S.cx = cx; gruen_S.cz = cz; gruen_S.cyaw = player.yaw; gruen_S.cam = [cx, cz, f.x / l, f.z / l];
  if (all) { for (const S of gruen_S.lod) gruen_lodRefresh(S, ...gruen_S.cam); gruen_S.queue = []; } else gruen_S.queue = [...gruen_S.lod];
  for (const c of gruen_S.chunks) { const d = Math.hypot(c.x - cx, c.z - cz), v = d < (c.vis || 88); for (const m of c.meshes) { m.visible = v; m.castShadow = d < (c.sh || 42) || !!c.town; } } }
// Weiches Gestrüpp: bremst und raschelt (eigene, leichte Prüfung – die Instanzen wechseln zwischen den Detailstufen)
function gruen_softAdd(x, z, r) { const k = (Math.floor(x / 4) + 200) * 1000 + Math.floor(z / 4) + 200; let L = gruen_S.soft.get(k); if (!L) gruen_S.soft.set(k, L = []); L.push([x, z, r]); }

// Ausgewählte Knoten eines glTF mit eingebackener Transformation (ohne die riesigen Stufen zu kopieren)
async function gruen_bake(key, names, file) {
  const s = await msModel(key, file); s.updateMatrixWorld(true); const out = {};
  s.traverse(o => { if (o.isMesh && names.includes(o.name)) { const g = o.geometry.clone().applyMatrix4(o.matrixWorld); g.computeBoundingBox(); g.computeBoundingSphere(); out[o.name] = { geo: g, mat: o.material }; } });
  return out; }
// Bildkarte (Billboard-Stufe der Scans) als Kreuz aus zwei Karten, Normalen nach oben (wie der Boden beleuchtet)
// (beide Wickelrichtungen, einseitig gerendert – so bleibt die Normale auch von hinten oben)
function gruen_card(p) { if (!p.geo.attributes.normal) p.geo.computeVertexNormals(); const flip = g => { const I = g.index; if (I) for (let i = 0; i < I.count; i += 3) { const t = I.getX(i + 1); I.setX(i + 1, I.getX(i + 2)); I.setX(i + 2, t); } return g; };
  const a = p.geo.clone(), b = a.clone().rotateY(PI / 2), g = mergeGeometries(a.index ? [a, flip(a.clone()), b, flip(b.clone())] : [a, b]); const nr = new Float32Array(g.attributes.position.count * 3); for (let i = 1; i < nr.length; i += 3) nr[i] = 1; g.setAttribute('normal', new THREE.BufferAttribute(nr, 3));
  g.computeBoundingBox(); g.computeBoundingSphere(); if (a.index) p.mat.side = THREE.FrontSide; return { geo: g, mat: p.mat }; }

// Zaun-Modell normieren: läuft entlang +x von 0 bis L, steht auf y = 0, Tiefe mittig
function gruen_norm(o, H) {
  o.updateMatrixWorld(true); const parts = [], bb = new THREE.Box3();
  o.traverse(m => { if (m.isMesh) { const g = m.geometry.clone().applyMatrix4(m.matrixWorld); g.computeBoundingBox(); bb.union(g.boundingBox); parts.push({ geo: g, mat: m.material }); } });
  const sz = bb.getSize(new THREE.Vector3()), rot = sz.z > sz.x, s = H / sz.y, L = (rot ? sz.z : sz.x) * s;
  const m4 = new THREE.Matrix4().makeTranslation(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
  if (rot) m4.premultiply(new THREE.Matrix4().makeRotationY(PI / 2));
  m4.premultiply(new THREE.Matrix4().makeScale(s, s, s)).premultiply(new THREE.Matrix4().makeTranslation(L / 2, 0, 0));
  for (const p of parts) { p.geo.applyMatrix4(m4); p.geo.computeBoundingBox(); p.geo.computeBoundingSphere(); }
  return { parts, L, H };
}
function gruen_inst(parts, list, shadow = true, col) { return parts.map(p => { const im = new THREE.InstancedMesh(p.geo, p.mat, list.length); list.forEach((m, i) => { im.setMatrixAt(i, m); if (col) im.setColorAt(i, col[i]); });
  im.castShadow = shadow; im.receiveShadow = true; im.computeBoundingSphere(); gruen_add(im); return im; }); }
// Flache Fläche mit Welt-Metern als UV (Scan-Oberflächen je 2 × 2 m)
function gruen_flat(x0, x1, z0, z1, y, mat) { const w = x1 - x0, l = z1 - z0, g = new THREE.PlaneGeometry(w, l); g.rotateX(-PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  const P = g.attributes.position, U = g.attributes.uv; for (let i = 0; i < U.count; i++) U.setXY(i, P.getX(i) / 2, -P.getZ(i) / 2);
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return gruen_add(m); }
// Instanzierte Boden-Flecken (Laub, Schlamm, Pfützen): Einheitsquadrat, pro Instanz Lage/Drehung/Größe
function gruen_decals(mat, list) { const g = new THREE.PlaneGeometry(1, 1); g.rotateX(-PI / 2); const im = new THREE.InstancedMesh(g, mat, Math.max(1, list.length));
  list.forEach(([x, y, z, ry, sx, sz], i) => im.setMatrixAt(i, gruen_m4(x, y, z, ry, sx, 1, sz))); im.count = list.length; im.receiveShadow = true; im.renderOrder = 1; im.computeBoundingSphere(); im.userData.noCol = true; return gruen_add(im); }
function gruen_decalMat(dir, tint, alpha, rough = .85, off = -2) {
  return new THREE.MeshStandardMaterial({ map: gruen_tex(dir + 'b.jpg', true), normalMap: gruen_tex(dir + 'n.jpg'), roughnessMap: gruen_tex(dir + 'orm.jpg'), alphaMap: alpha, color: tint, roughness: rough,
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: off, polygonOffsetUnits: off }); }
// Fund: kurzer Text, beim ersten Mal ins Tagebuch
function gruen_find(key, title, text, ms = 5200) { toast(text, ms); if (!gruen_S.found.has(key)) { gruen_S.found.add(key); if (!story.lore.some(l => l.key === key)) story.lore.push({ key, title, html: text }); } }

// ---- Belegung: alles, was schon steht (Häuser, Straßen, Autos, Bauten der anderen Teams), aus dem Szenengraphen rastern
function gruen_markBox(b) { if (b.min.y > 1.8 || b.max.y < -.3 || Math.max(b.max.x - b.min.x, b.max.z - b.min.z) > 30) return; gruen_mark(b.min.x - .1, b.max.x + .1, b.min.z - .1, b.max.z + .1, b.max.y < .3 ? 2 : 3); }
function gruen_raster(o) {
  const g = o.geometry, P = g.attributes.position, I = g.index, n = I ? I.count : P.count, mw = o.matrixWorld, O = gruen_O, cs = O.cs; if (n / 3 > 400000) return;
  const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
  for (let t = 0; t + 2 < n; t += 3) {
    A.fromBufferAttribute(P, I ? I.getX(t) : t).applyMatrix4(mw); B.fromBufferAttribute(P, I ? I.getX(t + 1) : t + 1).applyMatrix4(mw); C.fromBufferAttribute(P, I ? I.getX(t + 2) : t + 2).applyMatrix4(mw);
    const y0 = Math.min(A.y, B.y, C.y), y1 = Math.max(A.y, B.y, C.y); if (y0 > 1.6 || y1 < -.3) continue;
    const v = y1 < .3 ? 2 : 3, x0 = Math.min(A.x, B.x, C.x), x1 = Math.max(A.x, B.x, C.x), z0 = Math.min(A.z, B.z, C.z), z1 = Math.max(A.z, B.z, C.z);
    const d = (B.z - C.z) * (A.x - C.x) + (C.x - B.x) * (A.z - C.z);
    if ((x1 - x0) * (z1 - z0) < 1 || Math.abs(d) < 1e-6) { gruen_mark(x0, x1, z0, z1, v); continue; }
    const i0 = Math.max(0, Math.floor((x0 - O.x0) / cs)), i1 = Math.min(O.nx - 1, Math.floor((x1 - O.x0) / cs)), j0 = Math.max(0, Math.floor((z0 - O.z0) / cs)), j1 = Math.min(O.nz - 1, Math.floor((z1 - O.z0) / cs));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const px = O.x0 + (i + .5) * cs, pz = O.z0 + (j + .5) * cs;
      const l1 = ((B.z - C.z) * (px - C.x) + (C.x - B.x) * (pz - C.z)) / d, l2 = ((C.z - A.z) * (px - C.x) + (A.x - C.x) * (pz - C.z)) / d;
      if (l1 > -.06 && l2 > -.06 && 1 - l1 - l2 > -.06) { const k = j * O.nx + i; if (O.a[k] < v) O.a[k] = v; } }
  }
}
function gruen_scan() {
  scene.updateMatrixWorld(true); const box = new THREE.Box3(), m = new THREE.Matrix4(), skip = new Set([...(MS.trees || []), sky]);
  const vis = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; }; let n = 0;
  scene.traverse(o => {
    if (!o.isMesh || o.isSkinnedMesh || o.userData.gruen || skip.has(o)) return;
    const mt = Array.isArray(o.material) ? o.material[0] : o.material; if (!mt || mt === M.grass || mt.visible === false) return;
    if (mt.blending === THREE.AdditiveBlending || (mt.transparent && (mt.opacity < .6 || mt.depthWrite === false))) return;
    const g = o.geometry; if (!g || !g.attributes.position || !vis(o)) return; if (!g.boundingBox) g.computeBoundingBox(); n++;
    if (o.isInstancedMesh) { if (o.count > 6000) return; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); m.premultiply(o.matrixWorld); gruen_markBox(box.copy(g.boundingBox).applyMatrix4(m)); } return; }
    box.copy(g.boundingBox).applyMatrix4(o.matrixWorld);
    if (box.min.y > 1.8 || box.max.y < -.3 || box.max.x < gruen_O.x0 || box.min.x > -gruen_O.x0 || box.max.z < gruen_O.z0 || box.min.z > gruen_O.z0 + gruen_O.nz * gruen_O.cs) return;
    const fp = Math.max(box.max.x - box.min.x, box.max.z - box.min.z); if (fp <= 14) gruen_markBox(box); else if (fp < 400) gruen_raster(o);
  });
  return n; }

WORLD_MODS.push(['Böden & Pflanzen', async () => {
  const T0 = performance.now(), V3 = THREE.Vector3; scene.add(gruen_R);
  window.__gruen = gruen_S; gruen_S.api = { refresh: gruen_refreshAll, occ: gruen_occ }; // Testzugriff

  // ================= 1) Böden: Scan-Oberflächen + nasse Welt (ein gemeinsames Programm)
  try {
    const leafB = gruen_tex('leaves/b.jpg', true), floorB = gruen_tex('forestfloor/b.jpg', true), patchB = msTex('wet_asphalt/b.jpg', true);
    msSurf(M.grass, 'lawn1', { tint: 0x6c7560, nrm: .55 }); gruen_surf(M.grass, 0, leafB, floorB);
    msSurf(M.asphalt, 'road_asphalt', { tint: 0xf0f0f0 }); gruen_surf(M.asphalt, 1, patchB, floorB); // Albedo ~0,05 (nasser Asphalt) statt ~0,025: die Taschenlampe zeichnet einen sichtbaren Lichtfleck
    msSurf(M.sidewalk, 'pavement', { tint: 0x9c9c96 }); gruen_surf(M.sidewalk, 2, patchB, floorB);
    // Rinde (Schaukelast u. a.): Maserung entlang des Astes
    msSurf(M.bark, 'bark', { tint: 0x77706a, tile: 2 });
    for (const t of [M.bark.map, M.bark.normalMap, M.bark.roughnessMap]) if (t) { t.center.set(.5, .5); t.rotation = PI / 2; t.repeat.set(.5, 1.6); }
    // Fahrbahnmarkierung: abgefahrene Farbe mit der Körnung des Asphalts
    lineMat.color.set(0x8a8578); lineMat.normalMap = msTex('road_asphalt/n.jpg'); lineMat.roughnessMap = msTex('road_asphalt/orm.jpg'); lineMat.roughness = .85; lineMat.needsUpdate = true;
    // Bordsteine (falls „strasse“ sie nicht ersetzt hat): Welt-UVs statt über 70 m gestreckter Platten
    for (const o of scene.children) if (o.isMesh && !o.isInstancedMesh && o.material === M.sidewalk && o.geometry.type !== 'BoxGeometry' && o.visible) {
      const P = o.geometry.attributes.position, N = o.geometry.attributes.normal, U = o.geometry.attributes.uv; if (!U || !N) continue;
      for (let i = 0; i < P.count; i++) { const nx = Math.abs(N.getX(i)), ny = Math.abs(N.getY(i)); U.setXY(i, ny > .5 ? P.getX(i) / 3 : nx > .5 ? P.getZ(i) / 3 : P.getX(i) / 3, ny > .5 ? P.getZ(i) / 3 : P.getY(i) / 3); }
      U.needsUpdate = true; }
    // Boden jenseits der alten Kante (x = ±160): Waldboden bis in den Nebel
    for (const s of [-1, 1]) { const p = plane(44, 320, s * 182, -.005, 22, M.grass, -PI / 2, 0, gruen_R); p.userData.gruen = true; }
  } catch (e) { console.warn('gruen Böden', e); }

  // ================= 2) Selbstgebautes verstecken (Laub-Quads, gemalte Halme, Kugel-Hecken, Latten, Riegel)
  const oldFence = [];
  try {
    for (const o of [...scene.children]) {
      if (o.isInstancedMesh && o.material === M.hedge) o.visible = false;
      else if (o.material === M.fence) o.visible = false;                                                     // Latten (Instanzen) und Riegel (Batch)
      else if (o.isInstancedMesh && o.count === 9000 && o.geometry.type === 'PlaneGeometry') o.visible = false; // Laub
      else if (o.isInstancedMesh && o.count === 6000 && o.material.alphaTest > 0) o.visible = false;           // Grasbüschel
      else if (o.isInstancedMesh && o.material && o.material.name === 'MI_xh0rah1iy') oldFence.push(o);       // Weidezaun (loadMS)
    }
    // Weidezaun: nur der Südrand des Ortskerns und die Zäune an der Südstraße bleiben
    const e = new THREE.Matrix4();
    for (const im of oldFence) { let k = 0;
      for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, e); const el = e.elements, x = el[12], z = el[14], L = Math.hypot(el[0], el[2]) || 1, along = Math.abs(el[0] / L) > .9;
        if ((along && Math.abs(z + 32.4) < .6 && Math.abs(x) < 80) || (!along && Math.abs(Math.abs(x) - 4.6) < .4 && z < -32 && z > -47)) im.setMatrixAt(k++, e); }
      im.count = k; im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); }
    // Alter Randwald: die gescannten Ortsbäume (treeSpots) bleiben, der Gürtel wird an der neuen Grenze neu gepflanzt
    for (const im of MS.trees || []) { let k = 0;
      for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, e); const x = e.elements[12], z = e.elements[14]; if (treeSpots.some(([tx, tz]) => Math.abs(tx - x) < .05 && Math.abs(tz - z) < .05)) im.setMatrixAt(k++, e); }
      im.count = k; im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); }
  } catch (e) { console.warn('gruen Altbestand', e); }

  // ================= 3) Modelle laden
  const nm = (id, vars, lods) => vars.split('').flatMap(c => lods.map(l => `SM_${id}_Var${c}_LOD${l}`));
  let G1 = {}, G2 = {}, SP = {}, EL = {}, RA = {}, FD = null, FG = null, BOULDER = null;
  try {
    [G1, G2, SP, EL, RA] = await Promise.all([
      gruen_bake('wildgrass1', nm('vlkhcbxia', 'ABCDEFGH', [2, 3])), gruen_bake('wildgrass2', nm('vczndjqja', 'ABCDEFGH', [2, 3])),
      gruen_bake('spindle', nm('wk1ncbxja', 'ABDEHIJ', [1, 2, 3])), gruen_bake('elderberry', nm('wfzobb2ia', 'ACDF', [1, 2, 3])), gruen_bake('raspberry', nm('wf0oefeja', 'DEFH', [1, 2, 3]))]);
  } catch (e) { console.warn('gruen Pflanzen laden', e); }
  try {
    const pl = '../planks_painted/';
    const [fd, fg] = await Promise.all([
      msFBX('fence_dirty', 'model.fbx', { '*': { b: pl + 'b.jpg', n: pl + 'n.jpg', r: pl + 'orm.jpg', ao: pl + 'orm.jpg', color: 0xb8b4aa } }),
      msFBX('fence_garden', 'model.fbx', { '*': { b: 'Planks013_2K_Color.jpg', n: 'Planks013_2K_Normal.jpg', r: 'Planks013_2K_Roughness.jpg', ao: 'Planks013_2K_AmbientOcclusion.jpg', color: 0x8a8278 } })]);
    FD = gruen_norm(fd, 1.02); FG = gruen_norm(fg, .98);
  } catch (e) { console.warn('gruen Zäune laden', e); }
  try { BOULDER = (await MSL.gl.loadAsync('assets/boulder/model.gltf')).scene; } catch (e) { console.warn('gruen Stein', e); }

  // Pflanzen-Materialien: eigene Kopien (getönt), EIN Wind-Programm; Bildkarten ohne Normalen-Karte
  let g1v = [], g2v = [], hedgeV = [], shrubV = [], lowV = []; const bbOf = v => v[0][0].geo.boundingBox;
  try {
  const mats = new Map();
  const pm = (parts, rgb, wind) => { for (const p of Object.values(parts)) { const k = p.mat.uuid + rgb.join();
    if (!mats.has(k)) { const m = p.mat.clone(); m.color.setRGB(...rgb); m.envMapIntensity = .3; m.side = THREE.DoubleSide; if (/Billboard/.test(m.name)) { m.normalMap = null; m.alphaTest = .45; } gruen_wind(m, wind); mats.set(k, m); }
    p.mat = mats.get(k); } };
  pm(G1, [.58, .62, .46], .22); pm(G2, [.56, .58, .43], .14); pm(SP, [.6, .6, .5], .012); pm(EL, [.52, .5, .38], .02); pm(RA, [.52, .48, .38], .03);
  const V = (P, id, c, lods) => { const out = []; for (const l of lods) { const p = P[`SM_${id}_Var${c}_LOD${l}`]; if (!p) return null; out.push([l === 3 ? gruen_card(p) : p]); } return out; };
  g1v = 'ABCDEFGH'.split('').map(c => V(G1, 'vlkhcbxia', c, [2, 3])).filter(Boolean);
  g2v = 'ABCDEFGH'.split('').map(c => V(G2, 'vczndjqja', c, [2, 3])).filter(Boolean);
  hedgeV = 'BEJ'.split('').map(c => V(SP, 'wk1ncbxja', c, [1, 2])).filter(Boolean);
  shrubV = [...'AIJH'.split('').map(c => V(SP, 'wk1ncbxja', c, [1, 2, 3])), ...'ACDF'.split('').map(c => V(EL, 'wfzobb2ia', c, [1, 2, 3])), ...'DEFH'.split('').map(c => V(RA, 'wf0oefeja', c, [1, 2, 3]))].filter(Boolean);
  lowV = 'DE'.split('').map(c => V(RA, 'wf0oefeja', c, [2])).filter(Boolean); // niedrige Himbeeren als Heckenfuß
  } catch (e) { console.warn('gruen Pflanzen vorbereiten', e); }

  // ================= 4) Belegung rastern (Häuser, Straßen, Autos, alles der anderen Teams)
  try { gruen_S.stats.scan = gruen_scan(); } catch (e) { console.warn('gruen Raster', e); }
  const HEDGES = [[-39.5, -25, -8], [-17.5, -25, -8], [37, -25, -8], [59, -25, -8], [-39.5, 9, 25], [-17.5, 9, 25], [34, 9, 25], [58, 9, 25]];
  for (const [hx, z0, z1] of HEDGES) gruen_mark(hx - .7, hx + .7, z0 - .1, z1 + .1, 1);
  for (const [tx, tz] of treeSpots) gruen_markDisc(tx, tz, .45, 3);
  for (const h of houses) if (!h.hollow) { const fz = h.z + h.facing * h.d / 2, dx = h.doorX ?? h.x; gruen_mark(dx - 1.8, dx + 1.8, Math.min(fz, fz + h.facing * 2.4), Math.max(fz, fz + h.facing * 2.4), 1); }
  for (const [dx, fz] of [[23, -11.9], [-47, -11.9]]) gruen_mark(dx - 1.6, dx + 1.6, fz, fz + 1.6, 1);

  // ================= 5) Kieswege und Einfahrten (Nr. 4 offen, Nr. 9 zugewachsen hinter dem Zaun)
  const GRAVEL = [[-28.6, -27.4, -10.9, -7.35], [49.4, 50.6, -12.5, -7.35], [-50.6, -49.4, 7.35, 12.5], [-28.6, -27.4, 7.35, 12.5], [21.4, 22.6, 7.35, 12.5], [45.4, 46.6, 7.35, 10.9],
    [-22.7, -18.9, 6.02, 12.5], [55.9, 59.5, -12.5, -7.35]];
  try {
    const gm = gruen_surf(msSurfMat('gravel', { tint: 0x8e8a82 }), 3, msTex('wet_asphalt/b.jpg', true), msTex('wet_asphalt/b.jpg', true));
    GRAVEL.forEach(([x0, x1, z0, z1], i) => { gruen_flat(x0, x1, z0, z1, .012, gm); gruen_S.gravel.push([x0, x1, z0, z1]); if (i < 7) gruen_mark(x0, x1, z0, z1, 2); });
  } catch (e) { console.warn('gruen Kies', e); }
  for (const c of colliders) if (Math.abs(c.minX + 27) < .01 && Math.abs(c.maxX + 19) < .01 && Math.abs(c.minZ - 7.15) < .02) c.maxX = -23; // Zaun endet vor der Einfahrt Nr. 4

  // ================= 6) Gartenzäune und Tore (Scan-Modelle statt Latten; die schmalen Kisten der Zäune bleiben – man kann drüberklettern)
  try {
    const kinds = { d: FD, g: FG }, lists = { d: [], g: [] }, cols = { d: [], g: [] };
    const RUNS = [[-59, -48, -7.2, 'd'], [-46, -41, -7.2, 'd'], [-37, -29, -7.2, 'g'], [-27, -19, -7.2, 'g'], [17, 22, -7.2, 'd'], [24, 27.6, -7.2, 'd'], [29.6, 35, -7.2, 'd'], [41, 49, -7.2, 'g'], [51, 59, -7.2, 'g'],
      [-59, -51, 7.2, 'g'], [-49, -41, 7.2, 'g'], [-37, -29, 7.2, 'd'], [-27, -23, 7.2, 'd'], [13, 21, 7.2, 'g'], [23, 31, 7.2, 'g'], [37, 45, 7.2, 'd'], [47, 55, 7.2, 'd']];
    for (const [xa, xb, z, k] of RUNS) { const K = kinds[k]; if (!K) continue; const n = Math.max(1, Math.round((xb - xa) / K.L)), sx = (xb - xa) / (n * K.L);
      for (let i = 0; i < n; i++) { lists[k].push(gruen_m4(xa + i * K.L * sx, -.03, z, 0, sx, rand(.96, 1.04), 1, rand(-.035, .035), rand(-.012, .012))); const t = rand(.72, 1.02); cols[k].push(new THREE.Color(t, t * rand(.96, 1), t * rand(.9, 1))); }
      gruen_mark(xa, xb, z - .15, z + .15, 1); }
    for (const k of ['d', 'g']) if (kinds[k] && lists[k].length) gruen_inst(kinds[k].parts, lists[k], true, cols[k]);
    // Tore: das alte Latten-Tor wird unsichtbar (bleibt Klickfläche), das Modell hängt am Drehpunkt und schwingt mit
    const gateKind = (x, z) => (z < 0 ? { 23: 'd', [-47]: 'd', [-28]: 'g', 50: 'g' } : { [-50]: 'g', [-28]: 'd', 22: 'g', 46: 'd' })[x] || 'g';
    for (const G_ of gates) { const K = kinds[gateKind(G_.gapX, G_.z)]; if (!K) continue;
      for (const c of G_.piv.children) if (c.isMesh && c.material === M.fence) { if (c.userData.action) c.material = hidden; else c.visible = false; }
      for (const p of K.parts) { const m = new THREE.Mesh(p.geo, p.mat); m.scale.set(1.9 / K.L, .96, 1); m.position.y = -.02; m.castShadow = true; m.receiveShadow = true; m.userData.gruen = true; G_.piv.add(m); } }
  } catch (e) { console.warn('gruen Gartenzäune', e); }

  // ================= 7) Weidezaun an der neuen Außengrenze (+ Waldblock Süd seitlich)
  try {
    let parts = [];
    for (const im of oldFence) { im.geometry.computeBoundingBox(); const b = im.geometry.boundingBox; if (b.max.x - b.min.x > 2.5) parts.push({ geo: im.geometry, mat: im.material }); }
    parts.sort((a, b) => (a.geo.index ? a.geo.index.count : 0) - (b.geo.index ? b.geo.index.count : 0)); parts = parts.slice(0, 2);          // die zwei leichtesten Zaunfelder
    if (!parts.length) { const P = await msBake('fencepost'); P.forEach(p => { p.geo.computeBoundingBox(); p.mat.color.setScalar(.7); }); parts = P.filter(p => p.geo.boundingBox.max.x - p.geo.boundingBox.min.x > 2.5); }
    const CH = new Map(), O = gruen_OUT; let cnt = 0;
    const run = (x0, z0, x1, z1) => { const Ln = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(Ln / 3.05)), s = Ln / (n * 3.0), a = Math.atan2(-(z1 - z0), x1 - x0);
      for (let i = 0; i < n; i++) { const k = i / n, x = x0 + (x1 - x0) * k, z = z0 + (z1 - z0) * k; if (gruen_dustGap(x, z)) continue; const key = Math.floor(x / 32) + ',' + Math.floor(z / 32); let c = CH.get(key); if (!c) CH.set(key, c = { x: 0, z: 0, n: 0, L: parts.map(() => []) });
        c.L[Math.floor(rand(0, parts.length))].push(gruen_m4(x, 0, z, a, 1, rand(.95, 1.05), 1, rand(-.05, .05), rand(-.05, .05)).multiply(new THREE.Matrix4().makeScale(s, 1, 1))); c.x += x; c.z += z; c.n++; cnt++; } };
    run(O.x0, O.z0, O.x1, O.z0); run(O.x1, O.z0, O.x1, O.z1); run(O.x1, O.z1, O.x0, O.z1); run(O.x0, O.z1, O.x0, O.z0);
    run(79.4, -32.4, 79.4, O.z0); run(-79.4, -32.4, -79.4, O.z0);
    for (const c of CH.values()) { const meshes = []; c.L.forEach((l, i) => { if (l.length) meshes.push(...gruen_inst([parts[i]], l, true)); }); gruen_S.chunks.push({ x: c.x / c.n, z: c.z / c.n, meshes, vis: 72, sh: 30 }); }
    gruen_S.stats.fence = cnt;
  } catch (e) { console.warn('gruen Weidezaun', e); }

  // ================= 8) Toter Wald: dicht an der Außengrenze, im Nordosten/Nordwesten/Süden; Lichtung mit nach außen gebogenen Bäumen
  const forestShrubs = [];
  try {
    let treeParts = (MS.trees || []).map(im => ({ geo: im.geometry, mat: im.material }));
    if (treeParts.length < 2) { const [a, b] = await Promise.all([msBake('deadtree1'), msBake('deadtree3')]); treeParts = [...a, ...b]; treeParts.forEach(p => { p.mat.side = THREE.DoubleSide; p.mat.color.setScalar(.62); }); }
    const chunks = new Map(), up = new V3(0, 1, 0), C = gruen_CLEAR;
    const add = (x, z, m) => { const k = Math.floor(x / 26) + ',' + Math.floor(z / 26); let c = chunks.get(k); if (!c) chunks.set(k, c = { x: 0, z: 0, n: 0, L: treeParts.map(() => []) }); c.L[Math.min(treeParts.length - 1, Math.random() < .6 ? 0 : 1)].push(m); c.x += x; c.z += z; c.n++; };
    for (let gx = -176; gx <= 176; gx += 4.6) for (let gz = -70; gz <= 115; gz += 4.6) {
      const x = gx + rand(-1.8, 1.8), z = gz + rand(-1.8, 1.8), ins = gruen_inside(x, z), ad = gruen_areaDist(x, z), fd = gruen_fenceDist(x, z);
      if (ins && ad < 2.5) continue; if (gruen_dust(x, z)) continue; // Forbidden Dustwoods: eigener Wald (Modul wald)
      if (!ins && fd > 13) continue;
      if (fd < 1.7) continue;
      if (Math.abs(x) < 3.4 && z < -45 && z > -54) continue;                                   // alter Straßenrest hinter der Sperre
      if (ins && gruen_occ(x, z) >= 2) continue;                                                // Bauten der anderen Teams
      if ((z < -33 && Math.abs(x) < 79 && Math.random() < .4) || (!ins && fd > 5 && Math.random() < .3)) continue; // hinter Zäunen: lichter
      const dc = Math.hypot(x - C.x, z - C.z); if (dc < C.r) continue;
      const s = rand(.85, 1.45), ry = rand(0, 6.28); let m;
      if (dc < C.r + 6) { // Lichtung: alle Bäume vom Mittelpunkt weg geneigt
        const dx = (x - C.x) / dc, dz = (z - C.z) / dc, q = new THREE.Quaternion().setFromAxisAngle(new V3(dz, 0, -dx), rand(.2, .34) * (1 - (dc - C.r) / 9)).multiply(new THREE.Quaternion().setFromAxisAngle(up, ry));
        m = new THREE.Matrix4().compose(new V3(x, -.1, z), q, new V3(s, s, s));
      } else m = gruen_m4(x, -.1, z, ry, s, s, s, rand(-.07, .07), rand(-.07, .07));
      add(x, z, m); if (ins) gruen_markDisc(x, z, .5, 3);
      // Waldmantel: am Rand zu den offenen Gebieten und am Zaun dichtes Gestrüpp, tiefer drin vereinzelt
      if (ad < 9 || fd < 7 || Math.random() < .3) forestShrubs.push([x + rand(-2, 2), z + rand(-2, 2), Math.min(ad, fd + 2)]);
      if (ad < 7 || fd < 6) forestShrubs.push([x + rand(-2.2, 2.2), z + rand(-2.2, 2.2), Math.min(ad, fd + 2)]);
    }
    for (const c of chunks.values()) { const meshes = []; c.L.forEach((list, i) => { if (list.length) meshes.push(...gruen_inst([treeParts[i]], list, true)); });
      const cx = c.x / c.n, cz = c.z / c.n; gruen_S.chunks.push({ x: cx, z: cz, meshes, vis: 78, town: Math.abs(cx) < 90 && cz < -28 && cz > -60 }); }
    gruen_S.stats.trees = [...chunks.values()].reduce((s, c) => s + c.n, 0);
  } catch (e) { console.warn('gruen Wald', e); }

  // ================= 9) Hecken: dichter Spindelstrauch (Kisten-Hitbox 1,5 m bleibt), Fuß aus niedrigen Himbeeren und hohem Gras
  const tint = (a, b) => { const k = rand(0, 1); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; };
  try {
    if (hedgeV.length) {
      const H = gruen_lodSet('hecke', hedgeV, { d: [5.5, 55], shadow: [true, false] }), LOWS = lowV.length ? gruen_lodSet('heckenfuss', lowV, { d: [34] }) : null;
      for (const [hx, z0, z1] of HEDGES) {
        for (let z = z0 + .4; z <= z1 - .3; z += rand(.75, .95)) { const x = hx + rand(-.1, .1); if (gruen_occ(x, z) === 3 && gruen_occ(x - .6, z) === 3) continue; // steckt in einer Garage
          const v = Math.floor(rand(0, hedgeV.length)), s = rand(1.55, 1.85) / bbOf(hedgeV[v]).max.y; gruen_lodAdd(H, v, x, -.12, z, rand(0, 6.28), s, s * rand(.95, 1.06), .04, tint([.72, .74, .62], [1, 1, .9]), 1.22); }
        if (LOWS) for (let z = z0 + .3; z <= z1 - .2; z += rand(.8, 1.1)) for (const sd of [-1, 1]) { const x = hx + sd * rand(.28, .45); if (gruen_occ(x, z) === 3) continue;
          gruen_lodAdd(LOWS, Math.floor(rand(0, lowV.length)), x, -.02, z, rand(0, 6.28), rand(.9, 1.15), rand(.8, 1.1), .05, tint([.7, .68, .56], [.95, .92, .8])); }
        gruen_S.hedges.push([hx, z0, z1]);
      }
      gruen_lodBuild(H); if (LOWS) gruen_lodBuild(LOWS);
    }
  } catch (e) { console.warn('gruen Hecken', e); }

  // ================= 10) Gras, Wildwuchs, Waldmantel
  try {
    const G1S = gruen_lodSet('gras', g1v, { d: [9, 30], thin: 17 });
    const G2S = gruen_lodSet('gras_hoch', g2v, { d: [7.5, 36], thin: 21 });
    const SH = gruen_lodSet('gestruepp', shrubV, { d: [7, 22, 56], thin: 36, shadow: [true, false, false] });
    const DRY = [1.15, 1.0, .78], GRN = [.8, .95, .76];
    const edge = (x, z) => { for (const [a, b] of [[.7, 0], [-.7, 0], [0, .7], [0, -.7], [.5, .5], [-.5, -.5]]) { const o = gruen_occ(x + a, z + b); if (o >= 1 && o !== 255) return true; } return false; };
    const g2 = () => Math.min(g2v.length - 1, Math.random() < .68 ? [1, 2, 7][Math.floor(rand(0, 3))] : [0, 3, 4, 5, 6][Math.floor(rand(0, 5))]);
    const addG1 = (x, z, s) => gruen_lodAdd(G1S, Math.floor(rand(0, g1v.length)), x, 0, z, rand(0, 6.28), s, s * rand(.85, 1.25), .06, tint(DRY, GRN));
    const addG2 = (x, z, s) => gruen_lodAdd(G2S, g2(), x, 0, z, rand(0, 6.28), s, s * rand(.9, 1.3), .09, tint(DRY, GRN));
    const shrub = (x, z, big) => { const v = Math.floor(rand(0, shrubV.length)), bb = bbOf(shrubV[v]), s = Math.min(1.6, (big ? rand(1.1, 2.1) : rand(.6, 1.2)) / Math.max(.3, bb.max.y));
      gruen_lodAdd(SH, v, x, -.03, z, rand(0, 6.28), s, s, .05, tint([.72, .7, .58], [1, 1, .9])); gruen_softAdd(x, z, Math.min(1.2, Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) * s * .4)); gruen_markDisc(x, z, .5, 1); };
    // Rasen (Ort) und Wiesen (Erweiterungen, Grundlage für die anderen Teams)
    for (let gx = gruen_OUT.x0 + .5; gx < gruen_OUT.x1; gx += .5) for (let gz = gruen_OUT.z0 + .5; gz < gruen_OUT.z1; gz += .5) {
      const x = gx + rand(-.25, .25), z = gz + rand(-.25, .25), a = gruen_areaOf(x, z); if (a < 0 || gruen_occ(x, z) !== 0) continue;
      const nA = gruen_n(x * .09, z * .09), nB = gruen_n(x * .3 + 7, z * .3), nC = gruen_n(x * .8 + 3, z * .8 - 5), ed = edge(x, z);
      const lawn = a === 0 && Math.abs(x) < 62 && Math.abs(z) < 21.5;           // Vorgärten und Seitenstreifen: kurz; Hinterhöfe und Ortsränder: verwildert
      if (lawn) {
        if (ed) { if (Math.random() < .3) addG2(x, z, rand(.7, 1.15)); else if (Math.random() < .6) addG1(x, z, rand(1.3, 2)); continue; }
        if (Math.random() > .3 + nA * .45 + nC * .3) continue;
        if (Math.random() < .05 + nB * .08) addG2(x, z, rand(.55, .95)); else addG1(x, z, rand(1.2, 2.1));
      } else {
        if (Math.random() > .2 + nA * .45 + nC * .3) continue;
        if (nB > .74 && Math.random() < .02 && !ed) { shrub(x, z, false); continue; }
        if (Math.random() < .45 + nA * .25) addG2(x, z, rand(.8, 1.35)); else addG1(x, z, rand(1.3, 2.1));
      }
    }
    // Waldmantel und Unterholz (auch außerhalb des Zauns, damit der Wald auf Augenhöhe dicht ist)
    for (const [x, z, ad] of forestShrubs) { if (gruen_dust(x, z) || gruen_dustGap(x, z, 3)) continue; if (gruen_inside(x, z) && gruen_occ(x, z) >= 2) continue; if (gruen_fenceDist(x, z) < .8) continue; shrub(x, z, ad < 8);
      for (let i = 0; i < 2; i++) if (Math.random() < .75) addG2(x + rand(-1.8, 1.8), z + rand(-1.8, 1.8), rand(.9, 1.4)); }
    // Am Weidezaun innen: Himbeergestrüpp und hohes Gras
    const O = gruen_OUT, along = (x0, z0, x1, z1, nx, nz) => { const Ln = Math.hypot(x1 - x0, z1 - z0); for (let t = 0; t < Ln; t += rand(.9, 1.6)) { const k = t / Ln, d = rand(.9, 3.2), x = x0 + (x1 - x0) * k + nx * d, z = z0 + (z1 - z0) * k + nz * d;
        if (gruen_occ(x, z) >= 2 || gruen_dustGap(x, z, 3.5)) continue; if (Math.random() < .3) shrub(x, z, Math.random() < .5); addG2(x + rand(-.5, .5), z + rand(-.5, .5), rand(.9, 1.4)); } };
    along(O.x0, O.z0, O.x1, O.z0, 0, 1); along(O.x1, O.z0, O.x1, O.z1, -1, 0); along(O.x0, O.z1, O.x1, O.z1, 0, -1); along(O.x0, O.z0, O.x0, O.z1, 1, 0);
    // Übergänge an den alten Grenzlinien: Feldrain mit Lücken statt Zaun (Kirchweg-Gasse bei x ≈ −7 bleibt frei)
    for (let x = -77; x < 58; x += rand(1.6, 3.2)) { if (x > -14 && x < 0) continue; if (gruen_n(x * .08, 3.3) < .42) continue; const z = rand(30.6, 34.5); if (gruen_occ(x, z) >= 2) continue; shrub(x, z, Math.random() < .6); addG2(x + rand(-1, 1), z + rand(-1, 1), rand(.9, 1.3)); }
    for (const s of [-1, 1]) for (let z = -31; z < 31; z += rand(1.8, 3.4)) { if (Math.abs(z) < 9) continue; if (gruen_n(z * .09, s * 5.1) < .45) continue; const x = s * rand(74.5, 79); if (gruen_occ(x, z) >= 2) continue; shrub(x, z, Math.random() < .5); }
    // Lücken neben der Straßensperre (x ±3…±4,6): dichtes Gebüsch statt leerer Spalt
    for (const s of [-1, 1]) for (let z = -45.9; z > -47.2; z -= .6) shrub(s * rand(3.4, 4.3), z, true);
    for (const S of [G1S, G2S, SH]) gruen_lodBuild(S);
  } catch (e) { console.warn('gruen Gras', e); }

  // ================= 11) Laub, Schlamm, Pfützen (ein Decal-Programm für Laub/Schlamm/Erde)
  try {
    const lm = gruen_mask('leaf'), pmk = gruen_mask('pud');
    const leafMat = gruen_decalMat('leaves/', 0xd2b894, lm), mudMat = gruen_decalMat('forestfloor/', 0x4a4038, lm, .4, -3);
    const pudMat = new THREE.MeshStandardMaterial({ color: 0x07090c, roughness: .15, metalness: 0, alphaMap: pmk, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, envMapIntensity: .6 });
    pudMat.onBeforeCompile = sh => { Object.assign(sh.uniforms, { gT: gruen_S.uT, gRipK: { value: .24 }, gLamps: fogUniforms.lamps }); sh.vertexShader = gruen_VERT(sh.vertexShader);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + gruen_GLSL + 'uniform float gRipK;').replace('#include <map_fragment>', '#include <map_fragment>\n gPud = 1.;').replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + gruen_RIP).replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += gStreak(gW, 1., 1.) * opacity;'); };
    pudMat.customProgramCacheKey = () => 'gruenPud';
    const leaves = [], mud = [], pud = [];
    for (const s of [-1, 1]) { for (let x = -75; x < 75; x += rand(2.5, 6)) if (Math.abs(x) > 5) leaves.push([x, .024, s * rand(3.6, 3.8), rand(-.1, .1), rand(1.2, 2.6), rand(.35, .6)]);   // Rinnstein
      for (let z = -44; z < -6; z += rand(2.5, 5.5)) leaves.push([s * rand(3.6, 3.8), .024, z, PI / 2 + rand(-.1, .1), rand(1.2, 2.4), rand(.35, .55)]); }
    for (const [tx, tz] of treeSpots) for (let i = 0; i < 2; i++) { const a = rand(0, 6.28), r = rand(0, 1.6), x = tx + Math.cos(a) * r, z = tz + Math.sin(a) * r; if (gruen_occ(x, z) >= 2) continue; leaves.push([x, .006, z, rand(0, 6.28), rand(1.6, 3.2), rand(1.4, 2.8)]); }
    for (const [hx, z0, z1] of HEDGES) for (let z = z0; z < z1; z += rand(2, 4)) for (const s of [-1, 1]) if (Math.random() < .6) leaves.push([hx + s * rand(.8, 1.1), .006, z, rand(0, 6.28), rand(.8, 1.6), rand(.6, 1.2)]);
    for (const h of houses) if (!h.hollow) leaves.push([h.x + rand(-1, 1), .03, h.z + h.facing * (h.d / 2 + rand(1.2, 2)), rand(0, 6.28), rand(1, 1.8), rand(.8, 1.4)]);
    for (let i = 0; i < 26; i++) { const s = i % 2 ? 1 : -1; leaves.push([rand(-74, 74), .146, s * rand(4.4, 5.8), rand(0, 6.28), rand(.5, 1.1), rand(.4, .9)]); }
    for (let i = 0; i < 16; i++) { const s = i % 2 ? 1 : -1, x = rand(-72, 72); if (Math.abs(x) < 6) continue; pud.push([x, .145, s * rand(4.6, 5.5), rand(0, 6.28), rand(.7, 1.5), rand(.5, .9)]); }
    for (let z = -40; z < -8; z += rand(6, 11)) pud.push([(Math.random() < .5 ? -1 : 1) * rand(4.6, 5.4), .145, z, rand(0, 6.28), rand(.6, 1.2), rand(.5, .8)]);
    for (const [x0, x1, z0, z1] of GRAVEL) if (Math.random() < .7) pud.push([rand(x0 + .3, x1 - .3), .018, rand(z0 + .5, z1 - .5), rand(0, 6.28), Math.min(x1 - x0, 1.6) * rand(.5, .9), rand(.5, 1)]);
    let lawnP = 0; for (let t = 0; t < 500 && lawnP < 28; t++) { const x = rand(-76, 76), z = rand(-31, 31); if (gruen_occ(x, z) !== 0 || gruen_n(x * .15, z * .15) < .55) continue;
      const sx = rand(1, 2.4), sz = rand(.8, 1.8), ry = rand(0, 6.28); mud.push([x, .008, z, ry, sx * 1.5, sz * 1.5]); pud.push([x, .012, z, ry, sx, sz]); gruen_mark(x - sx / 2, x + sx / 2, z - sz / 2, z + sz / 2, 2); lawnP++; }
    gruen_decals(leafMat, leaves); gruen_decals(mudMat, mud); gruen_decals(pudMat, pud); gruen_S.pudList = pud;
    gruen_S.stats.decals = [leaves.length, mud.length, pud.length];
  } catch (e) { console.warn('gruen Laub/Pfützen', e); }

  // ================= 12) Entdeckbares
  try {
    // STORY-HOOK: Landestelle des Lichts – Lichtung im Nordost-Wald, Bäume nach außen gebogen, ein Kreis, in dem nichts wächst
    const C = gruen_CLEAR; gruen_decals(gruen_decalMat('forestfloor/', 0xa4a4ac, gruen_mask('disc'), .95), [[C.x, .01, C.z, 0, 7.4, 7.4]]); gruen_markDisc(C.x, C.z, 3.6, 2);
    { const L = gruen_S.lod.find(l => l.name === 'gras_hoch'); if (L) { for (let a = 0; a < PI * 2; a += .11) { const r = rand(3.5, 4.3); gruen_lodAdd(L, Math.floor(rand(0, L.variants.length)), C.x + Math.cos(a) * r, 0, C.z + Math.sin(a) * r, rand(0, 6.28), rand(.9, 1.3), rand(.9, 1.3), .15, [1.7, 1.7, 1.75]); }
      L.meshes.flat(2).forEach(im => im.removeFromParent()); gruen_lodBuild(L); } }
    const hit = box(7, .25, 7, C.x, .12, C.z, hidden, { cast: false, parent: gruen_R });
    interact(hit, 'Den Kreis untersuchen', () => { gruen_find('gruen_kreis', 'Der Kreis im Wald', 'Ein Kreis, in dem nichts wächst. Sieben Schritte breit. Die Bäume ringsum sind nach außen gebogen – als hätte hier etwas Schweres gelegen. Oder etwas Helles.', 6500);
      Audio.whisper(C.x, 1.4, C.z, 1.6); });
    // STORY-HOOK: sieben Kinder – sieben gewaschene Steine auf frischer Erde hinter Nr. 3
    if (BOULDER) {
      let sx = -23.5, sz = -25.2; for (let t = 0; t < 30 && gruen_occ(sx, sz) >= 2; t++) { sx = rand(-26, -21); sz = rand(-27, -23.5); }
      gruen_decals(gruen_decalMat('forestfloor/', 0x2a221c, gruen_mask('leaf'), .35, -3), [[sx, .009, sz, rand(0, 6.28), 2.1, 1.4]]); gruen_markDisc(sx, sz, 1, 3);
      BOULDER.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setScalar(.95); m.material.roughness = .6; } });
      const bb = new THREE.Box3().setFromObject(BOULDER), bs = bb.getSize(new V3());
      for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2, o = BOULDER.clone(), k = rand(.2, .27) / Math.max(bs.x, bs.z); o.scale.setScalar(k); o.position.set(-(bb.min.x + bb.max.x) / 2 * k, -bb.min.y * k - .03, -(bb.min.z + bb.max.z) / 2 * k);
        const g = new THREE.Group(); g.add(o); g.position.set(sx + Math.cos(a) * .55, 0, sz + Math.sin(a) * .38); g.rotation.y = rand(0, 6.28); o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); gruen_add(g); }
      const sh = box(1.6, .3, 1.1, sx, .15, sz, hidden, { cast: false, parent: gruen_R });
      interact(sh, 'Ansehen', () => gruen_find('gruen_steine', 'Sieben Steine', 'Sieben Steine im Kreis, auf frisch umgegrabener Erde. Jemand hat sie gewaschen. Die Stelle ist genau so lang wie ein Kind.', 6000));
    }
    // STORY-HOOK: Grenze – was am Weidezaun hängt (Lucy, 7/8, etwas ging hinaus)
    const O = gruen_OUT, SPOTS = [[-20, O.z1 - .15, 0, 'Der Draht ist nach außen gebogen. Als wäre etwas hinaus. Oder herein.'],
      [O.x1 - .15, 18, PI / 2, 'Am Stacheldraht hängen lange, helle Haare. Sie sind noch nass.'],
      [O.x0 + .15, -6, PI / 2, 'In den Pfahl sind Kerben geschnitten. Sieben alte. Eine frische.'],
      [-110, O.z0 + .15, 0, 'Hinter dem Zaun steht jemand zwischen den Stämmen. Du blinzelst. Nur ein Baumstumpf. Er war vorhin noch nicht da.']];
    SPOTS.forEach(([x, z, ry, txt], i) => { const b = box(2.8, 1.2, .5, x, .6, z, hidden, { cast: false, parent: gruen_R }); b.rotation.y = ry;
      interact(b, 'Den Zaun ansehen', () => { gruen_find('gruen_zaun' + i, 'Am Weidezaun', txt, 6000); if (i === 3) setTimeout(() => Audio.whisper(x, 1.5, z + (z < 0 ? -6 : 6), 1.4), 900); }); });
    // ---- Basis-Umsetzung: was die Zaun-Texte behaupten, hängt und steht am Zaun (verbogener Draht, nasse Haare am Stacheldraht, Kerben im Pfahl, der Baumstumpf)
    try {
      const wireM = new THREE.MeshStandardMaterial({ color: 0x77777a, roughness: .4, metalness: .9 }), R_ = ausbau_nord_rng(1992), tube = (pts, r) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 4, r, 5, false);
      // Nordzaun: zwei Drahtstränge, nach außen (Norden) gedrückt, ein Ende aufgebogen
      { const geos = []; for (const [y, bu] of [[.62, .55], [1.02, .42]]) { const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12, x = -21.7 + t * 3.4; pts.push(new THREE.Vector3(x, y - Math.sin(t * PI) * .06, O.z1 + .02 + Math.sin(t * PI) ** 1.6 * bu)); } geos.push(tube(pts, .0042)); }
        geos.push(tube([new THREE.Vector3(-18.3, .62, O.z1 + .02), new THREE.Vector3(-18.1, .72, O.z1 + .2), new THREE.Vector3(-17.9, .95, O.z1 + .32)], .0042));
        const m = new THREE.Mesh(mergeGeometries(geos), wireM); m.castShadow = true; m.userData.noCol = true; gruen_add(m); }
      // Ostzaun: Stacheldrahtstrang mit Stacheln, daran lange helle, noch nasse Haare
      { const X = O.x1 - .12, geos = [], barbs = [], hair = []; const pts = []; for (let i = 0; i <= 16; i++) pts.push(new THREE.Vector3(X, .98 - Math.sin(i / 16 * PI) * .05, 15.8 + i * .26)); geos.push(tube(pts, .0036));
        for (let i = 1; i < 16; i++) { const p = pts[i]; for (const a of [0, 1.57]) { const b = new THREE.CylinderGeometry(.0009, .0025, .026, 5); b.rotateX(a ? PI / 2 : 0); b.rotateZ(a ? 0 : PI / 2); b.translate(p.x, p.y, p.z); barbs.push(b); } }
        for (let k = 0; k < 15; k++) { const i = 2 + Math.floor(R_() * 12), p = pts[i], L = .35 + R_() * .45, hp = [p.clone()]; for (let j = 1; j <= 7; j++) hp.push(new THREE.Vector3(p.x - .01 - Math.sin(j * .4 + k) * .02 + (R_() - .5) * .01, p.y - j / 7 * L, p.z + Math.sin(j * .7 + k * 2) * .035 + j * .004)); hair.push(tube(hp, .00085)); }
        const wm = new THREE.Mesh(mergeGeometries([...geos, ...barbs]), wireM), hm = new THREE.Mesh(mergeGeometries(hair), new THREE.MeshStandardMaterial({ color: 0xe0d6b4, roughness: .12, metalness: 0, envMapIntensity: 1.6 })); wm.castShadow = true; hm.userData.noCol = wm.userData.noCol = true; gruen_add(wm); gruen_add(hm); }
      // Westzaun: ein Pfahl mit Kerben – sieben alte, eine frische
      { const X = O.x0 + .75, Z = -6, g = new THREE.BoxGeometry(.15, 1.45, .15); worldUV(g, .15, 1.45, .15, 1.2); const mat = msSurfMat('planks_painted', { tint: 0x7a6a56 }), post = new THREE.Mesh(g, mat); post.position.set(X, .72, Z); post.rotation.set(.02, .4, .03); post.castShadow = true; gruen_add(post);
        const top = new THREE.Mesh(new THREE.BoxGeometry(.16, .03, .16), mat); top.position.set(0, .745, 0); top.rotation.y = .1; post.add(top);
        for (let k = 0; k < 8; k++) { const fresh = k === 7, n = new THREE.Mesh(new THREE.BoxGeometry(.1, .013, .012), new THREE.MeshStandardMaterial({ color: fresh ? 0xe2cc98 : 0x1f1710, roughness: .9 })); n.position.set(-.005, .5 - k * .075 + (k === 7 ? -.015 : 0), .0765); n.rotation.z = (k - 3.5) * .035; post.add(n); const sh = new THREE.Mesh(new THREE.BoxGeometry(.11, .006, .004), new THREE.MeshStandardMaterial({ color: 0x0c0906 })); sh.position.set(-.005, n.position.y - .009, .0745); sh.rotation.z = n.rotation.z; post.add(sh); }
        post.traverse(o => { o.userData.noCol = false; }); }
      // Südzaun: hinter dem Zaun steht – sobald man nicht hinsieht – „jemand“: ein Baumstumpf (er war vorhin noch nicht da)
      { const st = await bu_mod('w_stumprot', 'model.glb', 1.55, 'y'); if (st) { st.position.set(-110.6, 0, O.z0 - 3.4); st.rotation.y = 1.3; st.visible = false; st.userData.noCol = true; scene.add(st); gruen_S.stumpf = st;
          WORLD_TICK.push((dt) => { const P = player.pos, dx = st.position.x - P.x, dz = st.position.z - P.z, d = Math.hypot(dx, dz); if (st.visible || d > 16 || d < 3) return; const f = new THREE.Vector3(); camera.getWorldDirection(f); if (f.x * dx / d + f.z * dz / d < .1) st.visible = true; }); } }
      // Absperrgitter im Nordzaun: mit Draht an die Pfosten gebunden (Wicklungen um die Gitterstäbe)
      { const geos = []; for (const x of [25.96, 30.0, 34.04]) for (const y of [.42, 1.28]) { const pts = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * PI * 2 * 4.2; pts.push(new THREE.Vector3(x + Math.cos(a) * .034, y + i / 40 * .13, 97.95 + Math.sin(a) * .034)); } geos.push(tube(pts, .0026)); geos.push(tube([pts[40], new THREE.Vector3(x + .06, y + .15, 97.9), new THREE.Vector3(x + .1, y + .12, 97.84)], .0026)); }
        const m = new THREE.Mesh(mergeGeometries(geos), wireM); m.castShadow = true; m.userData.noCol = true; gruen_add(m); }
    } catch (e) { console.warn('gruen Basis-Umsetzung Zaun', e); }
    // Pfützen: wer hineinsieht, sieht kurz jemanden hinter sich
    let pudScare = 0;
    (gruen_S.pudList || []).filter(p => p[1] > .1).slice(0, 6).forEach(([x, y, z, ry, sx, sz]) => { const b = box(sx * .8, .06, sz * .8, x, y + .02, z, hidden, { cast: false, parent: gruen_R }); b.rotation.y = ry;
      interact(b, 'In die Pfütze sehen', () => { if (pudScare++ % 3 === 0) { toast('Im Wasser spiegelt sich die Laterne. Und für einen Augenblick jemand, der direkt hinter dir steht.', 5200);
          const f = new V3(); camera.getWorldDirection(f); Audio.whisper(player.pos.x - f.x * 1.1, 1.6, player.pos.z - f.z * 1.1, 1.2); } else toast(Math.random() < .5 ? 'Regenringe. Dein Gesicht zerfällt darin.' : 'Das Wasser ist wärmer, als es sein dürfte.'); }); });
  } catch (e) { console.warn('gruen Entdeckbares', e); }
  try { await gruen_dustBarrierBau(); } catch (e) { console.warn('gruen Absperrgitter', e); } // Nordzaun-Lücke (Paket W2-P11)
  try { await gruen_wildBau(); } catch (e) { console.warn('gruen Wildschaden 1992 (AP-15)', e); }

  gruen_refreshAll();
  try { renderer.compileAsync(gruen_R, camera, scene).catch(() => {}); } catch (e) {}
  gruen_S.stats.ms = Math.round(performance.now() - T0);
}]);

// ---- pro Bild: Detailstufen nachführen, ferne Waldstücke ausblenden, Gestrüpp bremst/raschelt, Kies knirscht, der Wald lebt
WORLD_TICK.push((dt, t, indoor) => {
  const S = gruen_S; S.uT.value = t;
  const cx = camera.position.x, cz = camera.position.z; S.rt -= dt;
  let dy = Math.abs(player.yaw - S.cyaw) % (PI * 2); if (dy > PI) dy = PI * 2 - dy;
  if (S.rt < 0 || (cx - S.cx) ** 2 + (cz - S.cz) ** 2 > 2.2 || dy > .45) { S.rt = .8; gruen_refreshAll(false); }
  if (S.queue && S.queue.length) gruen_lodRefresh(S.queue.shift(), ...S.cam);
  if (state.started && !indoor) gruen_wildTick(dt);
  if (indoor || !state.started) return;
  const P = player.pos, sp = Math.hypot(vel.x, vel.z);
  // Gestrüpp
  let soft = 0; const bx = Math.floor(P.x / 4), bz = Math.floor(P.z / 4);
  for (let i = bx - 1; i <= bx + 1; i++) for (let j = bz - 1; j <= bz + 1; j++) { const Lst = S.soft.get((i + 200) * 1000 + j + 200); if (!Lst) continue;
    for (const [x, z, r] of Lst) { const d = Math.hypot(P.x - x, P.z - z); if (d < r + .3) soft = Math.max(soft, 1 - d / (r + .3)); } }
  if (soft > 0 && sp > .5) { const k = Math.max(0, 1 - soft * dt * 5); vel.x *= k; vel.z *= k; S.rust -= dt; if (S.rust < 0) { S.rust = rand(.22, .4); if (Audio.busch) Audio.busch(P.x, P.z, Math.min(1, soft * 1.6)); else Audio.step('grass'); } }
  // Kies
  if (player.stepIdx !== S.step) { S.step = player.stepIdx; if (sp > .6 && S.gravel.some(([a, b, c, d]) => P.x > a && P.x < b && P.z > c && P.z < d)) Audio.play('stones1', { gain: .16, rate: rand(1.5, 1.9), offset: rand(0, .4), dur: .2, vary: .1 }); }
  // Wald: Äste knacken im Dunkeln, selten ein Kichern
  S.amb -= dt; if (S.amb < 0) { S.amb = rand(22, 55); const ad = gruen_areaDist(P.x, P.z), fd = gruen_fenceDist(P.x, P.z);
    if (ad > 0 || fd < 14) { const a = rand(0, 6.28), d = rand(10, 18), x = P.x + Math.cos(a) * d, z = P.z + Math.sin(a) * d;
      if (gruen_areaDist(x, z) > 2 || !gruen_inside(x, z)) { Audio.play('woodCrack', { gain: rand(.25, .45), rate: rand(.8, 1.1), x, y: .4, z, ref: 5 }); if (Math.random() < .12) setTimeout(() => Audio.play('giggle', { gain: .12, rate: rand(.85, 1), x: x + 2, y: 1, z, ref: 4 }), rand(1500, 3000)); } } }
  // Hecken: etwas läuft darin mit
  S.hedgeT -= dt; if (S.hedgeT < 0) { S.hedgeT = rand(30, 70);
    const h = S.hedges.find(([hx, z0, z1]) => Math.abs(P.x - hx) < 4 && P.z > z0 - 2 && P.z < z1 + 2);
    if (h && sp > .4) { const [hx, z0, z1] = h, dir = Math.sign(vel.z) || 1; for (let i = 0; i < 5; i++) setTimeout(() => { const z = Math.max(z0, Math.min(z1, P.z + dir * (2 + i * .7))); Audio.play(Audio.pick('stepG1', 'stepG2', 'stepG3'), { gain: .5, rate: rand(1.1, 1.4), x: hx, y: .5, z, ref: 3 }); }, i * rand(180, 260)); }
  }
});

// ---- Nordzaun-Lücke (PK-A A1, Paket W2-P11): Absperrgitter vor den Forbidden Dustwoods. Zwei Elemente (Scan barrier_ms, je 5,4 m), mit Draht an die Zaunpfosten
// gebunden, Blechschild vom 13.07.1992 (Nacht der Bergung 3). Ab Kapitel 5 ist das rechte Element unten kindgroß aufgebogen, ab Kapitel 6 lässt es sich
// aufbiegen (E halten – Logik in kapitel6.js). Objekt gruen_S.dustBarrier: { A, B, pivB, hit, col, open, kid, setKid(on), setOpen(k 0…1) } (Kapitel 5 liest es nur).
async function gruen_dustBarrierBau() {
  // Scan-Wahl: barrier_ms ist eine Betonleitwand (lässt sich nicht aufbiegen) → Eisengitter-Scan ironfence_ms, 2 m hoch, je 4,1 m breit (wie das Villa-Tor)
  const T = THREE, src = await msModel('ironfence_ms'), el = () => { const f = msFit(src.clone(true), 2, 'y'); f.updateMatrixWorld(true); const s = new T.Box3().setFromObject(f).getSize(new T.Vector3()); f.scale.x *= 4.1 / Math.max(s.x, .1);
    const o = msGround(f); o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };
  const A = el(); A.position.set(27.98, 0, 98.02); A.rotation.y = .012; scene.add(A);
  // rechtes Element an einem Drehpunkt am linken Ende: unten aufgebogen (Kinderlücke) und aufschwenken (Kapitel 6)
  const pivB = new T.Group(); pivB.position.set(29.95, 0, 97.88); scene.add(pivB); const B = el(); B.position.set(2.05, 0, 0); pivB.add(B);
  // Blechschild, mit Draht ans linke Element gebunden
  const tx = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 320; const g = c.getContext('2d');
    g.fillStyle = '#d8d2bf'; g.fillRect(0, 0, 512, 320); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${110 + rand(0, 50)},${60 + rand(0, 25)},25,${rand(.05, .3)})`; g.beginPath(); g.arc(rand(0, 512), rand(0, 320), rand(2, 16), 0, 7); g.fill(); }
    g.strokeStyle = '#8a1c14'; g.lineWidth = 10; g.strokeRect(14, 14, 484, 292); g.fillStyle = '#1a1612'; g.textAlign = 'center'; g.font = 'bold 40px Arial'; g.fillText('FORBIDDEN DUSTWOODS', 256, 82); g.font = 'bold 34px Arial'; g.fillText('BETRETEN VERBOTEN', 256, 134); // Fassung 3: zweisprachig, das Auge halb abgekratzt
    g.strokeStyle = 'rgba(26,22,18,.7)'; g.lineWidth = 3; g.beginPath(); g.ellipse(446, 262, 22, 11, 0, 0, 7); g.stroke(); g.fillStyle = 'rgba(26,22,18,.7)'; g.beginPath(); g.arc(446, 262, 4, 0, 7); g.fill(); g.fillStyle = '#d8d2bf'; for (let i = 0; i < 26; i++) g.fillRect(430 + rand(0, 30), 248 + rand(0, 26), rand(3, 9), 2);
    g.font = '30px Arial'; g.fillText('Wildschaden', 256, 196); g.font = '24px Arial'; g.fillText('Gemeinde Lost Eyengless', 256, 244); g.fillText('13.07.1992', 256, 278);
    for (const [x, y] of [[26, 26], [486, 26], [26, 294], [486, 294]]) { g.fillStyle = '#4a3a2c'; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; })();
  const sign = new T.Mesh(new T.PlaneGeometry(.62, .39), new T.MeshStandardMaterial({ map: tx, roughness: .55, metalness: .45, side: T.DoubleSide })); sign.position.set(27.2, 1.02, 97.93); sign.rotation.set(.04, PI + .03, -.05); sign.castShadow = true; scene.add(sign);
  const col = addCol(25.3, 34.9, 97.45, 98.5, 2.4, -1); // die Gitter sind 0,9 m hoch: nicht darüber steigen (vor Kapitel 6 endet hier die Welt)
  const hit = box(9.4, 1.4, .9, 30.1, .7, 97.95, hidden, { cast: false });
  const D = gruen_S.dustBarrier = { A, B, pivB, sign, hit, col, open: false, kid: false, k: 0,
    setKid(on) { if (on === D.kid) return; D.kid = on; if (D.k === 0) pivB.rotation.set(0, 0, on ? .085 : 0); },
    setOpen(k) { D.k = k; const e = k * k * (3 - 2 * k); pivB.rotation.set(0, -1.15 * e, (D.kid ? .085 : 0) * (1 - e) + .05 * e); if (k >= 1 && !D.open) { D.open = true; col.minX = col.maxX = -9999; uninteract(hit); } } };
  interact(hit, () => D.open ? '' : (typeof wald_frei === 'function' && wald_frei()) ? 'Das Gitter aufbiegen (E halten)' : 'Absperrgitter',
    () => { if (typeof wald_frei === 'function' && wald_frei()) return; Audio.play('metalHit2', { gain: .12, rate: .8 }); toast('Mit Draht an die Pfosten gebunden. Dahinter ist es still. Zu still.', 3800); });
}

// =====================================================================  Fassung 3 (AP-15): Kapitel 1, Nebenaufgabe 18 „Wildschaden, 1992“ (Nordzaun, Z-03)
// Gespaltene Hufe, immer nur zwei nebeneinander in einer Linie (etwas auf zwei Beinen) bis zum Gitter und dahinter; Rufen/Klatschen: kein Echo;
// ein Fuchs zwischen den ersten Stämmen dreht den Kopf weiter, als ein Fuchs kann; Lampe weg, Lampe hin: nichts. Dackel-Anzeige „Bruno“ neben Z-03.
const gruen_F3 = { fuchs: null, t: 0, st: 'aus', hals: null, a: 0 };
async function gruen_wildBau() { const T = THREE, F = gruen_F3; window.__gruenF3 = F; // Testzugriff

  // Hufspuren im Matsch (Abziehbilder), Paare in einer Linie – vor und hinter dem Gitter
  const huf = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d'); g.clearRect(0, 0, 128, 128); g.fillStyle = 'rgba(18,14,10,.82)';
    for (const dx of [-14, 14]) { g.beginPath(); g.ellipse(64 + dx, 70, 11, 30, dx * .01, 0, 7); g.fill(); } g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .5})`; g.beginPath(); g.arc(Math.random() * 128, Math.random() * 128, 2 + Math.random() * 5, 0, 7); g.fill(); }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
  const hm = new T.MeshStandardMaterial({ map: huf, transparent: true, depthWrite: false, roughness: .15, metalness: .05, polygonOffset: true, polygonOffsetFactor: -3 });
  for (let i = 0; i < 16; i++) { const z = 86.5 + i * 1.05, x = 30.6 + Math.sin(i * .5) * .12; for (const s of [-1, 1]) { const m = new T.Mesh(new T.PlaneGeometry(.26, .3), hm); m.rotation.set(-PI / 2, 0, .02 * s); m.position.set(x + s * .16, .028 + (z > 98 ? .004 : 0), z + (s > 0 ? .04 : 0)); m.userData.noCol = true; m.renderOrder = 2; scene.add(m); } }
  // Anzeige neben dem laminierten Zeitungsausschnitt: „Dackel entlaufen · Bruno“
  const an = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 340; const g = c.getContext('2d'); g.fillStyle = '#e9e3cf'; g.fillRect(0, 0, 256, 340); g.fillStyle = '#222'; g.font = 'bold 34px Arial'; g.textAlign = 'center'; g.fillText('ENTLAUFEN', 128, 50);
    g.fillStyle = '#6a5040'; g.fillRect(58, 72, 140, 100); g.fillStyle = '#3a2a1c'; g.beginPath(); g.ellipse(128, 128, 56, 22, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(176, 110, 20, 16, 0, 0, 7); g.fill();
    g.fillStyle = '#222'; g.font = '24px Arial'; g.fillText('Dackel „Bruno“', 128, 210); g.font = '18px Arial'; g.fillText('hört auf seinen Namen', 128, 238); g.fillText('Belohnung!', 128, 266); g.fillText('Tel. 0 56 13 / 3 30 14', 128, 294);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
  const am = new T.Mesh(new T.PlaneGeometry(.2, .27), new T.MeshStandardMaterial({ map: an, roughness: .8, side: T.DoubleSide })); am.position.set(28.4, 1.12, 97.92); am.rotation.set(.02, PI - .04, .05); scene.add(am); am.userData.noCol = true;
  const ah = box(.3, .4, .4, 28.4, 1.12, 97.7, hidden, { cast: false }); interact(ah, 'Anzeige: Dackel entlaufen', () => { kirchberg_start('gruen_wild', { x: 28, z: 95 }); subtitle('Heißen hier alle Hunde Bruno?', 2600, 'LUKE'); });
  const sh = box(.8, .6, .4, 27.2, 1.02, 97.6, hidden, { cast: false }); interact(sh, 'Blechschild', () => { kirchberg_start('gruen_wild', { x: 28, z: 95 }); openNote('Blechschild am Gitter', '<b>FORBIDDEN DUSTWOODS · BETRETEN VERBOTEN</b>\nWALDGEBIET GESPERRT · Wildschaden\nGemeinde Lost Eyengless · 13.07.1992\n\n<i>Unten ein Auge, halb abgekratzt.</i>', 'gruen_schild', () => subtitle('Forbidden Dustwoods. Weil jemand zu faul für eine Übersetzung war.', 3600, 'LUKE')); });
  // Rufen / Klatschen: kein Echo, kein Nachklang – ein schalltoter Raum mit Bäumen
  const kh = box(3, 1.6, 1.2, 31.2, .8, 96.6, hidden, { cast: false }); interact(kh, 'In den Wald rufen', () => gruen_rufen());
  // der Fuchs zwischen den ersten Stämmen (Tier-Scan), zeigt sich nur im Lampenlicht
  try { const src = await msModel('animal_fox', 'model.glb'); const sk = typeof figuren_skc === 'function' ? await figuren_skc() : null; const o = sk ? sk(src) : src.clone(true); msFit(o, .42); const g = msGround(o); g.position.set(31.3, 0, 102.6); g.rotation.y = PI + .4; g.visible = false; g.userData.noCol = true; scene.add(g);
    o.traverse(b => { if (b.isBone && !F.hals && /neck|head/i.test(b.name)) F.hals = b; if (b.isMesh) { b.castShadow = true; b.frustumCulled = false; } }); F.fuchs = g; if (F.hals) F.hals0 = F.hals.quaternion.clone(); } catch (e) { console.warn('Nordzaun: Fuchs', e); }
}
async function gruen_rufen() { if (state.talking) return; state.talking = true; const F = gruen_F3; kirchberg_start('gruen_wild', { x: 28, z: 95 });
  try { const a = await kirchberg_wahl(['Rufen: „Hallo?“', 'In die Hände klatschen']); Audio.play(a === 1 ? 'woodHit1' : 'woodHit3', { gain: .5, rate: a === 1 ? 2.2 : 1.1 }); if (a === 0) subtitle('„Hallo?“', 1200, 'LUKE');
    await wait(2600); subtitle('Nichts. Kein Echo, kein Nachklang.', 2600); await wait(2200); await say([['Kein Hall. Nicht mal ein bisschen. Ein Wald hat immer Hall. Das hier ist ein schalltoter Raum mit Bäumen.', 5200, 'LUKE']]);
    F.gerufen = true; questPop('FIBEL', 'Wie groß ist der Wald?'); if (F.st === 'aus') F.st = 'bereit'; } finally { state.talking = false; gruen_wildCheck(); } }
function gruen_wildCheck() { const F = gruen_F3, z = typeof sammeln_hatZ === 'function' && sammeln_hatZ(3); kirchberg_desc('gruen_wild', `Hufspuren, das Schild, kein Echo. ${F.fuchs && F.gesehen ? 'Der Fuchs.' : ''}`);
  if (F.gerufen && F.gesehen && z) { kirchberg_fertig('gruen_wild', 'Wildschaden, 1992. Ohne Erklärung. Der Wald hat keinen Hall.'); if (!story.lore.some(l => l.key === 'gruen_wild')) story.lore.push({ key: 'gruen_wild', title: 'Wildschaden, 1992', html: 'Forbidden Dustwoods. Hufe, immer nur zwei nebeneinander, in einer Linie. Kein Echo. Ein Fuchs, der den Kopf zu weit dreht.' }); } }
// Takt: Fuchs im Lampenkegel – dreht den Kopf weiter, als ein Fuchs kann, bis das Gesicht fast auf dem Rücken liegt; Lampe weg, Lampe hin: nichts
const gruen_v = new THREE.Vector3(), gruen_q = new THREE.Quaternion(), gruen_ax = new THREE.Vector3(0, 1, 0);
function gruen_wildTick(dt) { const F = gruen_F3; if (!F.fuchs || kap() !== 1 || F.st === 'fertig') return; const P = player.pos, g = F.fuchs, d = Math.hypot(P.x - g.position.x, P.z - g.position.z); if (d > 22) return;
  gruen_v.set(g.position.x - camera.position.x, .3 - camera.position.y, g.position.z - camera.position.z).normalize(); const imLicht = flashOn && fwd.dot(gruen_v) > .96;
  if (F.st === 'bereit' && imLicht) { F.st = 'da'; g.visible = true; F.a = 0; F.gesehen = true; if (typeof spannung_mark === 'function') try { spannung_mark('welt2'); } catch (e) {} }
  if (F.st === 'da') { F.a = Math.min(2.7, F.a + dt * .55 * (1 - F.a / 3.2)); if (F.hals && F.hals0) { F.hals.quaternion.copy(F.hals0); gruen_q.setFromAxisAngle(gruen_ax, F.a); F.hals.quaternion.multiply(gruen_q); }
    if (!imLicht) { F.weg = (F.weg || 0) + dt; if (F.weg > .35) { g.visible = false; F.st = 'fertig'; gruen_wildCheck(); } } else F.weg = 0; } }
