// =====================================================================  HERVORHEBUNG (Modul „hervorhebung“, Nutzer-Rückmeldung R-1/R-2 vom 01.10.2026)
// R-1: leuchtende Kontur um interaktive Objekte, eine Farbe je Kategorie – weiche, leicht pulsierende Aura entlang der Silhouette mit feinem Schimmer (Rauschen/Partikel),
//   nie harte Neonlinie. Technik: Masken-Pass direkt nach dem RenderPass (Silhouetten der Kandidaten in einen halb aufgelösten Puffer; verdeckte Teile per Tiefenvergleich
//   mit der Szenentiefe verworfen) + Kantenpass nach dem OutputPass (Aura außen, feiner Rand innen). Kandidaten aus IA.list der Basis (Interaktion): höchstens 6 innerhalb 8 m
//   + das angesehene. Deutlich in Reichweite/beim Hinsehen, sehr dezent auf mittlere Distanz; aus in Jagd, Kino, Dialog, Menüs. Einstellung settings.hl: 2 stark · 1 dezent · 0 aus.
//   Legende: beim ersten Sichten Fibel-Eintrag „Ränder“ (Lukes Ton).
// R-2: Glanz-Gegenstände (Whiskeys Schnabel, Tauschware am Boden): echtes Metallmodell (Fab „OldKey“), polierter Messing mit scharfem Glanzlicht (Umgebungsbild),
//   weiche runde Glitzerpunkte, die beim Drehen/Bewegen aufblitzen, leiser Schein, kristalliner Fundklang aus den Spieluhr-Aufnahmen (VSCO 2, kein Oszillator).
// Schnittstelle: mesh.userData.hl = 'interakt' | 'sammel' | 'hinweis' | 'glanz' | 'sammlung' | 'aus' (oder Funktion) · mesh.userData.hlObj = sichtbares Objekt (oder Funktion, null = keins)
//   – ohne Angabe: Kategorie aus dem Text; sichtbar = das Mesh selbst bzw. die Modelle innerhalb der unsichtbaren Klickfläche (Figuren nie).
//   glanz_neu({ size, an }) → { g, key, … } (in die Szene hängen; an() = sichtbar) · glanz_klang(x, y, z) · glanz_tex() · Testzugriff window.__hl
// Nutzer 02.10.: Logik der Ränder – Lesbares Blau (nach dem ersten Lesen gedämpft), nur einmal Lesbares Weiß (danach kein Rand), Wichtiges Gold, Seltenes Purpurrosa.
const HL_FARBE = { interakt: 0x9fb3c4, lesbar: 0x5ea8ff, einmal: 0xf6f2ea, sammel: 0x69f0c0, wichtig: 0xffc23d, selten: 0xff6fd8, glanz: 0xff8f45 }; // Eisgrau · Mondblau · Weiß · Jadegrün · Gold · Purpurrosa · Kupfer
const HL_GELESEN = .32; // Blau nach dem ersten Lesen: sichtbar schwächer („hatte ich schon“), nie ganz weg
const HL_WICHTIG = /schlüssel|sicherung|brechstange|drahtschneider|feuerzeug|kerze|ring\b|lampe|laterne|leiter|batterie|funkgerät|fibel|kamera|seil|messer|stablampe/i;
const HL_STUFE = { 2: [1, .72, .2], 1: [.62, .4, .07] }; // [angesehen, in Reichweite/im Blick, mittlere Distanz (fällt bis 8 m auf 0)]
const HL_TEXT = [['aus', /sprechen|streicheln|hand nehmen|berühren|^whiskey|^justin$/i], ['glanz', /glänzt|glänzend|glitzer|kronkorken|münze|pfennig/i],
  ['selten', /foto aufheben|polaroid|stundenbuch|laternenbote|pells heft|heftseite|loses blatt|lose seite|eine zeitung/i],
  ['einmal', /zettel|notiz|\bbriefe?\b|zeitung|tagebuch|akte|kassette|notenblatt|umschlag|handy|heft|rekorder|seite|protokoll|nachricht|liste\b|quittung|postkarte/i],
  ['lesbar', /lesen|kalender|zeichnung|tafel|plan an|foto|bild|grabstein|schild|chronik|inschrift|aushang|karte an|gedenk/i],
  ['sammel', /aufheben|\bnehmen\b|einstecken|mitnehmen|einsammeln/i]];
const HL = { ready: false, slots: [], scene: null, rt: null, glow: null, mask: null, uD: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uNF: { value: new THREE.Vector2(.05, 110) }, uUseD: { value: 0 },
  t: 0, chk: 0, aktiv: 0, cand: new Array(64).fill(null), dist: new Float32Array(64), look: new Uint8Array(64), fwd: new THREE.Vector3(), v: new THREE.Vector3(), s: new THREE.Sphere(), b: new THREE.Box3(),
  cc: new THREE.Color(), near: [], nearBig: [], sc: { stack: [], out: [], big: [] }, items: null, itemsT: 0, resolveN: 0, legende: false, ms: 0, benutzt: new Set(), karte: null };
MOD_SAVE.push(['hervorhebung', () => [...HL.benutzt].slice(-600), v => { if (Array.isArray(v)) v.forEach(k => HL.benutzt.add(k)); }]);
const GLZ = { liftT: 0, rc: null, hits: [], proto: null, laden: null, mat: null, tex: null, halo: null, list: [], v: new THREE.Vector3() };

// ---------------------------------------------------------------- Kategorie und sichtbares Objekt
function hl_text(l) { l = l.replace(/<[^>]*>/g, '').trim(); for (const [k, re] of HL_TEXT) if (re.test(l)) return k;
  if (HL.t > HL.itemsT) { HL.itemsT = HL.t + 10; try { HL.items = new Set(Object.values(ITEMS).map(i => String(i.name || '').toLowerCase())); } catch (e) {} }
  return HL.items && HL.items.has(l.toLowerCase()) ? 'sammel' : 'interakt'; }
function hl_wichtig(l) { if (HL_WICHTIG.test(l)) return true; try { const L = l.toLowerCase(); for (const [k, it] of Object.entries(ITEMS)) { const n = String(it.name || '').toLowerCase();
  if (n.length > 3 && L.includes(n) && ((typeof WHISKEY_NIE !== 'undefined' && WHISKEY_NIE.has(k)) || ICONS[k] === ICONS.key)) return true; } } catch (e) {} return false; }
// Schon benutzt? (über Speichern/Laden: Schlüssel aus Text + Ort)
function hl_key(o) { const u = o.userData; if (u.hlKey) return u.hlKey; const g = o.geometry; if (g && !g.boundingSphere) g.computeBoundingSphere(); const c = g ? HL.s.copy(g.boundingSphere).applyMatrix4(o.matrixWorld).center : o.position;
  let l = ''; try { l = String(typeof u.label === 'function' ? u.label() : u.label).replace(/<[^>]*>/g, ''); } catch (e) {} return (u.hlKey = l.slice(0, 40) + '@' + Math.round(c.x * 2) + ',' + Math.round(c.z * 2)); }
const hl_benutzt = o => !!o.userData.hlBenutzt || HL.benutzt.has(hl_key(o));
function hl_kat(o) { const u = o.userData; if (u.hlKt > HL.t) return u.hlK; u.hlKt = HL.t + 1 + Math.random(); let k = 'aus';
  try { const l = typeof u.label === 'function' ? u.label() : u.label; if (l) { const L = String(l).replace(/<[^>]*>/g, ''); let h = typeof u.hl === 'function' ? u.hl() : u.hl;
      if (h === 'sammlung') h = 'selten'; if (h === 'hinweis') { h = hl_text(L); if (h !== 'einmal' && h !== 'lesbar') h = 'lesbar'; } k = h || hl_text(L);
      if (k === 'sammel' && hl_wichtig(L)) k = 'wichtig'; if (k === 'einmal' && hl_benutzt(o)) k = 'aus'; } } catch (e) {}
  return (u.hlK = HL_FARBE[k] ? k : 'aus'); }
function hl_ok(m) { if (!m.isMesh || m.isInstancedMesh || m.isBatchedMesh || !m.geometry || m.material === hidden) return false; const M = m.material; return Array.isArray(M) ? M.some(x => x.visible !== false) : !!M && M.visible !== false; }
function hl_sichtbar(o) { for (let p = o; p; p = p.parent) { if (!p.visible) return false; if (p === scene) return true; } return false; }
function hl_visuals(o) { // sichtbare Meshes zum Klickobjekt (gecacht in userData.hlV)
  const u = o.userData;
  if (u.hlObj !== undefined) { let x = null; try { x = typeof u.hlObj === 'function' ? u.hlObj() : u.hlObj; } catch (e) {} if (!x) return null;
    if (x !== u.hlX) { u.hlX = x; u.hlV = []; x.traverse(m => { if (hl_ok(m)) u.hlV.push(m); }); } return u.hlV.length ? u.hlV : null; }
  if (u.hlV) return u.hlV; if (u.hlVt > HL.t) return null;
  const V = [];
  if (hl_ok(o)) { const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); if (g.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis() < 3 && !o.isSkinnedMesh) V.push(o); }
  else { // unsichtbare Klickfläche: die Modelle aus der Nahliste (hl_scan), deren Mitte darin liegt
    if (HL.resolveN <= 0) return null; HL.resolveN--; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox();
    const B = HL.b.copy(g.boundingBox).applyMatrix4(o.matrixWorld).expandByScalar(.12), lim = B.getSize(HL.v).length() * .75 + .25, N = HL.near;
    for (let i = 0; i < N.length && V.length < 12; i++) { const m = N[i]; if (m === o || !m.parent) continue; HL.s.copy(m.geometry.boundingSphere).applyMatrix4(m.matrixWorld); if (HL.s.radius < lim && B.containsPoint(HL.s.center)) V.push(m); } }
  if (V.length) return (u.hlV = V); u.hlVt = HL.t + 3; return null; } // noch nichts geladen: in 3 s wieder versuchen

// Nahliste: die Szene wird über mehrere Bilder verteilt durchlaufen (je Bild höchstens 500 Knoten), gesammelt werden kleine sichtbare Modelle bis 14 m um Luke
function hl_scan() { const S = HL.sc, P = camera.position; let n = 0;
  if (!S.stack.length) { HL.near = S.out; HL.nearBig = S.big; S.out = []; S.big = []; S.stack.push(scene); }
  while (S.stack.length && n++ < 500) { const o = S.stack.pop(); if (!o.visible) continue; const c = o.children; for (let i = 0; i < c.length; i++) S.stack.push(c[i]);
    if (!o.isMesh || o.isSkinnedMesh || !hl_ok(o)) continue; const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); if (g.boundingSphere.radius > 400) continue;
    HL.s.copy(g.boundingSphere).applyMatrix4(o.matrixWorld); if (HL.s.radius < 3) { if (HL.s.center.distanceToSquared(P) < 196) S.out.push(o); } else if (HL.s.center.distanceTo(P) - HL.s.radius < 14) S.big.push(o); } } // big: Böden/Gehwege für glanz_boden
// ---------------------------------------------------------------- Masken-Material (Kategorie-Farbe × Stärke; verdeckt = verworfen)
function hl_maskMat() { return new THREE.ShaderMaterial({ uniforms: { tDepth: HL.uD, res: HL.uRes, nf: HL.uNF, useD: HL.uUseD, col: { value: new THREE.Color() }, k: { value: 0 } },
  vertexShader: `#include <common>
#include <skinning_pars_vertex>
varying float vVz;
void main() {
#include <skinbase_vertex>
#include <begin_vertex>
#include <skinning_vertex>
  vec4 mv = modelViewMatrix * vec4(transformed, 1.); vVz = -mv.z; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform sampler2D tDepth; uniform vec2 res, nf; uniform float useD, k; uniform vec3 col; varying float vVz;
void main() {
  if (useD > .5) { float d = texture2D(tDepth, gl_FragCoord.xy / res).x; float sz = nf.x * nf.y / (nf.y - (nf.y - nf.x) * d); if (vVz > sz + .06 + vVz * .025) discard; }
  gl_FragColor = vec4(col * k, 1.); }`, side: THREE.DoubleSide, depthTest: false, depthWrite: false, blending: THREE.NoBlending }); }
function hl_proxy(src, s) { let p = src.userData.hlP;
  if (!p) { p = src.isSkinnedMesh ? new THREE.SkinnedMesh(src.geometry, s.mat) : new THREE.Mesh(src.geometry, s.mat);
    if (src.isSkinnedMesh) { p.bind(src.skeleton, src.bindMatrix); p.bindMode = src.bindMode; p.frustumCulled = false; }
    p.matrixAutoUpdate = false; p.visible = false; p.userData.src = src; HL.scene.add(p); src.userData.hlP = p; }
  return p; }
function hl_frei(s) { for (let i = 0; i < s.px.length; i++) { s.px[i].visible = false; if (s.px[i].userData.slot === s) s.px[i].userData.slot = null; } s.px.length = 0; s.o = null; s.k = 0; s.sel = false; }
function hl_nimm(o, d, look) {
  let s = null; for (let i = 0; i < HL.slots.length; i++) if (HL.slots[i].o === o) { s = HL.slots[i]; break; }
  if (!s) { for (let i = 0; i < HL.slots.length; i++) if (!HL.slots[i].o) { s = HL.slots[i]; break; }
    if (!s) { let lo = 9; for (let i = 0; i < HL.slots.length; i++) { const q = HL.slots[i]; if (!q.sel && q.k < lo) { lo = q.k; s = q; } } if (!s) return; hl_frei(s); }
    const V = hl_visuals(o); if (!V) return; s.o = o; s.k = 0; s.ph = Math.random() * 6.28;
    for (let i = 0; i < V.length; i++) { const p = hl_proxy(V[i], s); const q = p.userData.slot; if (q && q !== s && q.o) continue; p.userData.slot = s; p.material = s.mat; s.px.push(p); } }
  if (s.o !== o) return; s.cat = hl_kat(o); s.mat.uniforms.col.value.setHex(HL_FARBE[s.cat] || HL_FARBE.interakt); s.sel = true; s.d = d; s.look = look; }
function hl_waehle() { // 5× je Sekunde: die 6 nächsten Kandidaten innerhalb 8 m + das angesehene
  const L = IA.list, c = camera.position, f = HL.fwd; camera.getWorldDirection(f); HL.resolveN = 2; let n = 0;
  for (let i = 0; i < L.length && n < 64; i++) { const o = L[i], u = o.userData; if (!u.action || !o.geometry) continue; const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
    HL.s.copy(g.boundingSphere).applyMatrix4(o.matrixWorld); const dc = HL.s.center.distanceTo(c), d = Math.max(0, dc - HL.s.radius); if (d > 8 && o !== target) continue;
    if (!hl_sichtbar(o) || hl_kat(o) === 'aus' || !hl_visuals(o)) continue;
    HL.v.subVectors(HL.s.center, c).multiplyScalar(1 / Math.max(dc, 1e-3)); HL.cand[n] = o; HL.dist[n] = d; HL.look[n] = HL.v.dot(f) > .975 ? 1 : 0; n++; }
  for (let i = 0; i < HL.slots.length; i++) HL.slots[i].sel = false;
  for (let r = 0; r < 6; r++) { let bi = -1, bd = 1e9; for (let i = 0; i < n; i++) if (HL.cand[i] && HL.dist[i] < bd) { bd = HL.dist[i]; bi = i; } if (bi < 0) break; hl_nimm(HL.cand[bi], bd, HL.look[bi]); HL.cand[bi] = null; }
  for (let i = 0; i < n; i++) { if (HL.cand[i] && (HL.cand[i] === target || HL.look[i] && HL.dist[i] < 6)) hl_nimm(HL.cand[i], HL.dist[i], HL.look[i]); HL.cand[i] = null; } }
function hl_aus() { try { if (ch2.spiderPhase === 'lock' || ch2.spiderPhase === 'swarm' || ch2.spiderPhase === 'shake') return true; /* Spinnenraum: keine Ränder, keine Erklärkarte mitten im Schwarm */ if (!state.started || menu.attract || state.ending || state.talking || ui.overlay || ui.paused || scripted || camOverride || state.blackout) return true;
  if (typeof kino_S !== 'undefined' && kino_S.on) return true; if (typeof SP !== 'undefined' && SP.chase) return true; } catch (e) {} return false; }
// Masken-Pass (nach dem RenderPass): liest die eben aufgelöste Szenentiefe, zeichnet nur die Stellvertreter der aktiven Kandidaten
function hl_maske(r, wb, rb) { if (!HL.aktiv) return;
  HL.uD.value = rb.depthTexture || null; HL.uUseD.value = rb.depthTexture ? 1 : 0; HL.uNF.value.set(camera.near, camera.far);
  for (let i = 0; i < HL.slots.length; i++) { const s = HL.slots[i], on = s.k > .004; for (let j = 0; j < s.px.length; j++) { const p = s.px[j], src = p.userData.src; p.visible = on && hl_sichtbar(src); if (p.visible) p.matrixWorld.copy(src.matrixWorld); } }
  const old = r.getRenderTarget(), ac = r.autoClear, ca = r.getClearAlpha(); r.getClearColor(HL.cc);
  r.setRenderTarget(HL.rt); r.setClearColor(0x000000, 0); r.clear(true, false, false); r.autoClear = false; r.render(HL.scene, camera); r.autoClear = ac; r.setClearColor(HL.cc, ca); r.setRenderTarget(old); }
function hl_glowPass() { const p = new ShaderPass({ uniforms: { tDiffuse: { value: null }, tMask: { value: null }, time: { value: 0 }, asp: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse, tMask; uniform float time, asp; varying vec2 vUv;
    float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv), m0 = texture2D(tMask, vUv);
      vec2 r1 = vec2(.0030 / asp, .0030), r2 = vec2(.0075 / asp, .0075), r3 = vec2(.0150 / asp, .0150); vec3 g = vec3(0.); float a = 0.;
      for (int i = 0; i < 14; i++) { float w = float(i) * .4487989 + .2, j = .85 + .3 * fract(float(i) * .618); vec2 d = vec2(cos(w), sin(w)), d2 = vec2(cos(w + .224), sin(w + .224)), d3 = vec2(cos(w + .112), sin(w + .112));
        vec4 s1 = texture2D(tMask, vUv + d * r1), s2 = texture2D(tMask, vUv + d2 * r2 * j), s3 = texture2D(tMask, vUv + d3 * r3 * j);
        g += s1.rgb * .0225 + s2.rgb * .0225 + s3.rgb * .0175; a += s1.a * .0225 + s2.a * .0225 + s3.a * .0175; }
      vec2 q = vUv * vec2(asp, 1.);
      float n = vn(q * 18. + vec2(0., -time * .5)) * .6 + vn(q * 40. + vec2(time * .2, -time * .9)) * .4; /* langsame, weiche Schwankung statt Pixelrauschen */
      vec3 aura = g * (1. - m0.a) * (.62 + .55 * n); /* dezent: kein Funkeln mehr, keine Perlen */
      vec3 rim = m0.rgb * (clamp(1. - a * 1.1, 0., 1.) * .22 + .03) * (.8 + .2 * n);
      vec3 e = clamp(aura * 1.6 + rim, 0., 1.);
      c.rgb = 1. - (1. - c.rgb) * (1. - e);
      gl_FragColor = c; }` }); return p; }

// ---------------------------------------------------------------- Legende (einmal, beim ersten Sichten) und Einstellung
const HL_LEG = [['einmal', 'Weiß', 'Nur einmal zu lesen – danach steht es in der Fibel, der Rand erlischt'], ['lesbar', 'Blau', 'Lesbar – nach dem ersten Lesen nur noch ein schwacher Schimmer'],
  ['wichtig', 'Gold', 'Wichtig – das brauchst du, um weiterzukommen'], ['selten', 'Purpurrosa', 'Selten – Fotos und Seiten, die zusammengehören'],
  ['sammel', 'Jadegrün', 'Zum Mitnehmen'], ['glanz', 'Kupfer', 'Glänzendes – für Whiskey'], ['interakt', 'Eisgrau', 'Türen, Schalter, alles zum Untersuchen']];
function hl_dot(c, px = 12) { const h = '#' + c.toString(16).padStart(6, '0'); return `<span style="display:inline-block;width:${px}px;height:${px}px;border-radius:50%;background:${h};box-shadow:0 0 6px ${h},0 0 14px ${h}88;vertical-align:middle;margin-right:10px"></span>`; }
function hl_fibelHtml() { return `<span class="hand">Seit dieser Nacht sehe ich Ränder. Um manche Dinge liegt ein Schimmer, wie Atem auf kaltem Glas – erst, wenn ich nah dran bin oder lange genug hinsehe.\n\nIch hab mir die Farben gemerkt:</span>\n` +
  HL_LEG.map(([k, n, t]) => `${hl_dot(HL_FARBE[k])}<b>${n}</b> – ${t}`).join('\n') + `\n\n<span class="hand">Lucy hätte gesagt, der Ort will mir was zeigen. Ich sag: zu wenig Schlaf.</span>\n<small>Einstellungen → Objekt-Hervorhebung: stark · dezent · aus</small>`; }
// Erklärkarte beim ersten Sichten: ruhig, links, blockiert nichts (man kann weitergehen), schließt nach 14 s oder mit E/Klick
function hl_karte(K, n = 0) { if (HL.karte || document.getElementById('hlKarte')) return; if (!K && HL.tourGezeigt) return; /* die Fibel-Tour (fibeltour.js) hat die Ränder-Legende schon gezeigt: kein zweites Fenster mitten im Bild */ if (typeof obt_ruhig === 'function' && !obt_ruhig() && n < 150) return void setTimeout(() => { try { hl_karte(K, n + 1); } catch (e) {} }, 700); /* Textführung: nicht mitten im Bild, solange Untertitel laufen – wartet auf Ruhe */ const d = document.createElement('div'); d.id = 'hlKarte'; HL.karte = d;
  d.style.cssText = 'position:fixed;left:3.2vw;top:50%;transform:translate(-14px,-50%);z-index:9000;max-width:470px;padding:24px 28px 20px;background:linear-gradient(160deg,rgba(14,16,20,.93),rgba(8,9,12,.9));border:1px solid rgba(220,210,190,.16);box-shadow:0 18px 60px rgba(0,0,0,.65),inset 0 0 40px rgba(255,255,255,.02);color:#ddd6c8;font-family:Georgia,serif;opacity:0;transition:opacity .9s ease,transform .9s ease;pointer-events:auto;border-radius:3px';
  d.innerHTML = K ? K : `<div style="font:13px/1 'Special Elite',Georgia,serif;letter-spacing:.32em;opacity:.55;margin-bottom:12px">RÄNDER</div>
    <div style="font-size:19px;line-height:1.45;margin-bottom:16px;font-style:italic;opacity:.9">Um manche Dinge liegt ein Schimmer. Die Farbe sagt, was es ist.</div>` +
    HL_LEG.map(([k, n, t]) => `<div style="display:flex;align-items:center;font-size:17px;line-height:1.35;margin:9px 0">${hl_dot(HL_FARBE[k], 15)}<span><b style="font-weight:600;letter-spacing:.03em">${n}</b><span style="opacity:.78"> – ${t}</span></span></div>`).join('') +
    `<div style="margin-top:16px;font-size:14px;opacity:.5;letter-spacing:.06em">E · weiter &nbsp;·&nbsp; jederzeit in der Fibel unter „Ränder“</div>`;
  document.body.appendChild(d); requestAnimationFrame(() => { d.style.opacity = 1; d.style.transform = 'translate(0,-50%)'; });
  const zu = () => { if (!HL.karte) return; HL.karte = null; d.style.opacity = 0; d.style.transform = 'translate(-14px,-50%)'; setTimeout(() => d.remove(), 950); removeEventListener('keydown', taste, true); };
  const taste = e => { if (e.code === 'KeyE' || e.code === 'Escape') { e.stopPropagation(); zu(); } }; addEventListener('keydown', taste, true); d.onclick = zu; HL.karteZu = zu; let sicht = 0; const iv = setInterval(() => { if (!HL.karte) return clearInterval(iv); const ruhig = typeof obt_ruhig !== 'function' || obt_ruhig(); d.style.opacity = ruhig ? 1 : 0; d.style.pointerEvents = ruhig ? 'auto' : 'none'; if (ruhig && (sicht += .4) >= 14) { clearInterval(iv); zu(); } }, 400); }
// Nachbilder (die blauen Lichter, „Berühren“): beim ersten Sichten erklären, was sie sind und – ohne die spätere Enthüllung vorwegzunehmen – dass nur Luke sie sieht
const HL_NB = `<div style="font:13px/1 'Special Elite',Georgia,serif;letter-spacing:.32em;opacity:.55;margin-bottom:12px">NACHBILDER</div>
  <div style="display:flex;align-items:center;margin-bottom:14px"><span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:radial-gradient(circle,#e6f0ff 0%,#8fb6ff 45%,rgba(143,182,255,0) 75%);box-shadow:0 0 14px #8fb6ff,0 0 30px #8fb6ff66;margin-right:14px"></span>
  <span style="font-size:19px;line-height:1.45;font-style:italic;opacity:.92">Ein blaues Licht, das in der Luft hängt.</span></div>
  <div style="font-size:17px;line-height:1.5;opacity:.86;margin:8px 0"><b style="font-weight:600">Was es ist:</b> Etwas, das hier passiert ist, hat sich in den Ort gebrannt – wie ein Nachbild im Auge, wenn man zu lange in eine Lampe gesehen hat.</div>
  <div style="font-size:17px;line-height:1.5;opacity:.86;margin:8px 0"><b style="font-weight:600">Was es tut:</b> Berühren (E). Für ein paar Sekunden siehst und hörst du, was damals war. Danach erlischt das Licht; das Gesehene steht in der Fibel.</div>
  <div style="font-size:17px;line-height:1.5;opacity:.86;margin:8px 0"><b style="font-weight:600">Warum du es siehst:</b> <span class="hand" style="font-size:19px">Lucy hat sie nie gesehen. Niemand hier. Nur ich. Ich weiß noch nicht, was das über mich sagt.</span></div>
  <div style="margin-top:16px;font-size:14px;opacity:.5;letter-spacing:.06em">E · weiter &nbsp;·&nbsp; in der Fibel unter „Nachbilder“</div>`;
function hl_nachbild() { if (HL.nbGezeigt) return; try { if (story.lore.some(l => l.key === 'nachbilder')) { HL.nbGezeigt = true; return; } if (typeof echoAnchors === 'undefined' || HL.karte || state.talking || ui.overlay) return;
    const c = camera.position; camera.getWorldDirection(HL.fwd);
    for (const a of echoAnchors) { if (!a.s.visible) continue; const p = a.s.position, dx = p.x - c.x, dy = p.y - c.y, dz = p.z - c.z, d = Math.hypot(dx, dy, dz); if (d > 11 || d < .5) continue;
      if ((dx * HL.fwd.x + dy * HL.fwd.y + dz * HL.fwd.z) / d < .9) continue; HL.nbGezeigt = true;
      story.lore.push({ key: 'nachbilder', title: 'Nachbilder', html: `<span class="hand">Blaue Lichter, die in der Luft hängen. Wenn ich eins berühre, sehe ich, was dort passiert ist – Menschen wie aus Licht, Stimmen von damals. Danach ist es weg, als hätte ich es aufgebraucht.\n\nWie ein Nachbild, wenn man zu lange in eine Lampe gesehen hat.\n\nLucy hat sie nie gesehen. Niemand hier. Nur ich. Ich weiß noch nicht, was das über mich sagt.</span>` });
      subtitle('<i>Da hängt ein Licht in der Luft. Blau. Wie ein Nachbild, wenn man zu lange in eine Lampe gesehen hat.</i>', 4600, 'LUKE'); setTimeout(() => { try { hl_karte(HL_NB); } catch (e) {} }, 2200); return; } } catch (e) {} }
// ---------------------------------------------------------------- Warum Luke die Nachbilder sieht (Nutzer 02.10.: „sinnvoll und spannend: weil er nicht der echte Luke ist“)
// Kanon (story_final.md): Nachbilder sieht nur, wer lange im Licht/Nimmerheim war oder aus so jemandem gemacht ist. Stufenweise, nie vor der Enthüllung (Kap. 5, der echte Luke im Stall):
//   1 erstes Licht: „Nur ich.“ · 2 nach dem Nachbild im Kinderzimmer (er sieht sich selbst wie einen Fremden) · 3 Nimmerheim (die Behaltenen sehen sie auch – die waren lange im Licht)
//   · 4 nach dem Stall: Er ist nicht der, der weggegangen ist; er ist aus einem gemacht, der lange im Licht war. Jede Stufe schreibt die Fibel-Seite „Nachbilder“ fort.
const NB_TEXT = {
  2: 'Der Junge auf der Bettkante war ich. Ich hab mich gesehen wie einen Fremden. Wer sieht sich selbst als Nachbild?',
  3: 'Hier drin sehen sie alle. Die Behaltenen. Die waren lange im Licht. Und ich sehe sie seit der ersten Nacht.',
  4: 'Er hat gefragt, ob sein Leben schön war. Sein Leben. Das, an das ich mich erinnere. Darum sehe ich die Nachbilder: Ich bin nicht der, der damals weggegangen ist. Ich bin aus einem gemacht, der lange im Licht war.' };
function nb_wissen(n) { try { const L = story.lore.find(l => l.key === 'nachbilder'); if (!L) return; const k = 'nb:' + n; if (HL.benutzt.has(k)) return;
    HL.benutzt.add(k); L.html += `\n\n<span class="hand">${NB_TEXT[n]}</span>`;
    const t = NB_TEXT[n]; if (n === 4) { setTimeout(() => { subtitle('<i>' + t + '</i>', 9000, 'LUKE'); try { questPop('FIBEL', 'Nachbilder – warum ich sie sehe'); } catch (e) {} }, 2500); }
    else if (typeof gedanke === 'function') gedanke('nb_' + n, t, 1800, 3); else setTimeout(() => subtitle('<i>' + t + '</i>', 5600, 'LUKE'), 1800); } catch (e) {} }

// ---------------------------------------------------------------- Glitzern an Gegenständen zum Mitnehmen (Nutzer 02.10.: „deutlich erkennbar, glitzern und schimmern, extrem hochwertig, nicht billig“)
// Wie in RE/TLOU: ein kurzer, scharfer Lichtstern auf der Oberkante des Gegenstands – selten (alle 2,4–4,2 s), stärker im Lampenkegel, nie Dauerblinken.
// Nur für Jadegrün/Gold/Purpurrosa (zum Mitnehmen, wichtig, selten) und nur, solange der Rand aktiv ist (in Reichweite). Gold glitzert wärmer, Purpurrosa kühler.
const GLI = { pool: [], tex: null };
function gli_tex() { if (GLI.tex) return GLI.tex; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), m = 64;
  const g = x.createRadialGradient(m, m, 0, m, m, 22); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  x.globalCompositeOperation = 'lighter'; for (const [a, l, w] of [[0, 62, 2.2], [Math.PI / 2, 62, 2.2], [Math.PI / 4, 30, 1.2], [-Math.PI / 4, 30, 1.2]]) { x.save(); x.translate(m, m); x.rotate(a);
    const q = x.createLinearGradient(-l, 0, l, 0); q.addColorStop(0, 'rgba(255,255,255,0)'); q.addColorStop(.5, 'rgba(255,255,255,.95)'); q.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = q; x.fillRect(-l, -w, l * 2, w * 2); x.restore(); }
  GLI.tex = new THREE.CanvasTexture(c); GLI.tex.colorSpace = THREE.SRGBColorSpace; return GLI.tex; }
function gli_tick(dt, t, aus) { const lit = typeof flashOn !== 'undefined' && flashOn && FLASH.charge > 0, c = camera.position; camera.getWorldDirection(HL.fwd);
  for (let i = 0; i < HL.slots.length; i++) { const s = HL.slots[i]; let p = GLI.pool[i];
    if (!p) { p = GLI.pool[i] = new THREE.Sprite(new THREE.SpriteMaterial({ map: gli_tex(), transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, fog: false })); p.visible = false; p.renderOrder = 960; p.userData = { ph: Math.random() * 9, per: 2.4 + Math.random() * 1.8, src: null }; scene.add(p); }
    const ok = !aus && s.o && s.k > .05 && (s.cat === 'sammel' || s.cat === 'wichtig' || s.cat === 'selten'); if (!ok) { p.visible = false; continue; }
    const V = s.o.userData.hlV && s.o.userData.hlV[0] || s.o; const g = V.geometry; if (!g) { p.visible = false; continue; } if (!g.boundingSphere) g.computeBoundingSphere();
    HL.s.copy(g.boundingSphere).applyMatrix4(V.matrixWorld); const ctr = HL.s.center, d = ctr.distanceTo(c); if (d > 12) { p.visible = false; continue; }
    const u = p.userData, ph = ((t + u.ph) % u.per) / u.per, f = ph < .12 ? Math.sin(ph / .12 * Math.PI) : 0; // kurzes Aufblitzen
    const cone = lit ? Math.max(0, ((ctr.x - c.x) * HL.fwd.x + (ctr.y - c.y) * HL.fwd.y + (ctr.z - c.z) * HL.fwd.z) / Math.max(d, 1e-3) - .93) / .07 : 0;
    const a = f * (.55 + .45 * Math.min(1, cone + (d < 2.5 ? .5 : 0))) * Math.min(1, s.k * 1.6); if (a < .02) { p.visible = false; continue; }
    // auf der Oberkante, leicht zur Kamera hin (dort sitzt das Glanzlicht)
    HL.v.subVectors(c, ctr).normalize(); p.position.copy(ctr).addScaledVector(HL.v, HL.s.radius * .55); p.position.y += HL.s.radius * .45;
    p.material.color.setHex(s.cat === 'wichtig' ? 0xffe2a0 : s.cat === 'selten' ? 0xffd6f4 : 0xe6fff6); p.material.opacity = a; p.material.rotation = .3 + t * .4;
    p.scale.setScalar((.09 + d * .012) * (.6 + .9 * f)); p.visible = true; } }
function hl_legende(still) { if (HL.legende) return; HL.legende = true; // still = true: nur den Fibel-Eintrag anlegen (Fibel-Tour), ohne Untertitel und ohne Erklärkarte
  try { const alt = story.lore.find(l => l.key === 'hervorhebung'); if (alt) { alt.html = hl_fibelHtml(); return; } // alter Spielstand: Fibel auf die neuen Farben bringen, keine zweite Karte
    story.lore.push({ key: 'hervorhebung', title: 'Ränder', html: hl_fibelHtml() });
    if (still) return;
    subtitle('<i>Da liegt ein Schimmer drum. Als wollte es gefunden werden.</i>', 3600, 'LUKE'); setTimeout(() => { try { hl_karte(); } catch (e) {} }, 1800); } catch (e) {} }
// Benutzt merken: E auf ein angesehenes Objekt (vor der Aktion der Basis, damit es auch bei schließenden Notizen zählt)
addEventListener('keydown', e => { try { if (e.code !== 'KeyE' || e.repeat || ui.overlay || !target || !target.userData.action) return; const u = target.userData; u.hlBenutzt = true; HL.benutzt.add(hl_key(target)); u.hlKt = 0; } catch (er) {} }, true);
function hl_einstellung() { try { const P = document.getElementById('subPanel'), z = P && P.querySelector(':scope > div.close'); if (!z || !P.querySelector('#sGfx') || document.getElementById('sHl')) return;
  z.insertAdjacentHTML('beforebegin', `<div class="row"><span>Objekt-Hervorhebung</span><select id="sHl">${[[2, 'stark'], [1, 'dezent'], [0, 'aus']].map(([v, n]) => `<option value="${v}" ${(settings.hl ?? 2) === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`);
  const s = document.getElementById('sHl'); s.onclick = ev => ev.stopPropagation(); s.onchange = ev => { settings.hl = +ev.target.value; saveSettings(); }; } catch (e) {} }

// ---------------------------------------------------------------- R-2 Glanz: Metallmodell, Glitzerpunkte, Schein, Klang
function glanz_tex() { if (GLZ.tex) return GLZ.tex; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,250,1)'); g.addColorStop(.14, 'rgba(255,248,226,.9)'); g.addColorStop(.38, 'rgba(255,228,176,.24)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  GLZ.tex = new THREE.CanvasTexture(c); GLZ.tex.colorSpace = THREE.SRGBColorSpace; return GLZ.tex; }
function glanz_haloTex() { if (GLZ.halo) return GLZ.halo; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,214,140,.6)'); g.addColorStop(.45, 'rgba(255,190,110,.14)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  GLZ.halo = new THREE.CanvasTexture(c); GLZ.halo.colorSpace = THREE.SRGBColorSpace; return GLZ.halo; }
function glanz_mat() { if (GLZ.mat) return GLZ.mat; // polierter Messing: Umgebungsbild (Nachthimmel, Natriumlaternen am Horizont, Mond) gibt das scharfe Glanzlicht auch ohne Lampe
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, '#1b2333'); g.addColorStop(.47, '#4d5668'); g.addColorStop(.53, '#242019'); g.addColorStop(1, '#0b0c0f'); x.fillStyle = g; x.fillRect(0, 0, 256, 128);
  const blob = (px, py, r, col) => { const q = x.createRadialGradient(px, py, 0, px, py, r); q.addColorStop(0, col); q.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = q; x.fillRect(px - r, py - r, r * 2, r * 2); };
  [[30, 60], [95, 58], [170, 61], [228, 59]].forEach(([px, py]) => blob(px, py, 9, 'rgba(255,190,110,1)')); blob(140, 22, 7, 'rgba(225,235,255,1)'); blob(60, 30, 14, 'rgba(150,170,210,.5)');
  const env = new THREE.CanvasTexture(c); env.mapping = THREE.EquirectangularReflectionMapping; env.colorSpace = THREE.SRGBColorSpace;
  GLZ.mat = new THREE.MeshStandardMaterial({ color: 0xdcb878, metalness: 1, roughness: .2, envMap: env, envMapIntensity: 1.7, emissive: 0x3a2810, emissiveIntensity: .5 }); return GLZ.mat; }
function glanz_laden() { if (!GLZ.laden) GLZ.laden = (async () => { try { // Fab „OldKey“ (Unreal-Export schluesselteil), auf Einheitsgröße, Mitte im Ursprung
  const src = await msModel('../ue/schluesselteil', 'model.glb'), o = src.clone(true), w = new THREE.Group(); w.add(o); o.traverse(m => { if (m.isMesh) { m.material = glanz_mat(); m.castShadow = false; m.receiveShadow = false; m.userData.noCol = true; } });
  w.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(w), s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3()); o.position.sub(c); w.scale.setScalar(1 / Math.max(s.x, s.y, s.z, 1e-4));
  GLZ.proto = w; for (const it of GLZ.list) glanz_key(it); return w; } catch (e) { console.warn('Glanz: Modell fehlt', e); return null; } })(); return GLZ.laden; }
function glanz_key(it) { if (it.key || !GLZ.proto) return; const k = GLZ.proto.clone(true); k.scale.multiplyScalar(it.size); k.rotation.y = it.ry; it.key = k; it.g.add(k); }
function glanz_neu(o = {}) { // → { g (Gruppe: Schlüssel + 2 Glitzerpunkte + Schein), key, size, an }
  const g = new THREE.Group(); g.userData.noCol = true; const mk = (t, op) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: op })); s.renderOrder = 2; g.add(s); return s; };
  const it = { g, key: null, size: o.size || .07, ry: o.ry ?? Math.random() * 6.28, an: o.an || null, boden: !!o.boden, versuch: 0, mit: o.mit || null, ph: Math.random() * 6.28, halo: mk(glanz_haloTex(), 0), gl: [mk(glanz_tex(), 0), mk(glanz_tex(), 0)], k: o.k ?? 1 };
  it.gl[0].position.set(it.size * .3, it.size * .08, 0); it.gl[1].position.set(-it.size * .28, it.size * .1, it.size * .06); glanz_mat(); GLZ.list.push(it); glanz_key(it); glanz_laden(); return it; }
function glanz_boden(it) { // am Boden: auf die sichtbare Oberfläche heben (der Fundort liegt teils auf dem Kollisionsboden unter Gehweg/Laub)
  const g = it.g, rc = GLZ.rc || (GLZ.rc = new THREE.Raycaster()); rc.camera = camera; rc.far = 1.6; rc.set(HL.v.set(g.position.x, g.position.y + 1.2, g.position.z), GLZ.v.set(0, -1, 0));
  const H = rc.intersectObjects(HL.near, false, GLZ.hits); rc.intersectObjects(HL.nearBig, false, H); H.sort((a, b) => a.distance - b.distance); let y = null;
  for (const h of H) { const o = h.object; if (o.isSprite || o.isPoints || o.isLine || !hl_ok(o) || !hl_sichtbar(o)) continue; let mine = false; for (let p = o; p; p = p.parent) if (p === g) { mine = true; break; } if (mine) continue; y = h.point.y; break; }
  H.length = 0; if (y === null) return false; const dy = y + .004 - g.position.y; if (Math.abs(dy) > .9) return true; g.position.y += dy; if (it.mit) for (const o of it.mit) o.position.y += dy; return true; }
function glanz_tick(dt, t) { const cam = camera.position, lit = typeof flashOn !== 'undefined' && flashOn && FLASH.charge > 0; camera.getWorldDirection(HL.fwd);
  for (let i = 0; i < GLZ.list.length; i++) { const it = GLZ.list[i], g = it.g;
    if (it.an) { let on = false; try { on = it.an(); } catch (e) {} g.visible = on; } if (!g.visible) continue;
    const p = g.position, dx = cam.x - p.x, dy = cam.y - p.y, dz = cam.z - p.z, d = Math.hypot(dx, dy, dz); if (d > 40) { if (it.an) g.visible = false; continue; } if (it.boden && d < 12 && t > GLZ.liftT && HL.nearBig.length) { GLZ.liftT = t + .3; if (glanz_boden(it) || ++it.versuch > 8) it.boden = false; }
    // Lampenkegel: im Licht der Taschenlampe glänzt es stärker (Glanz nur, wo Metall ist – und Licht darauf fällt)
    const inv = 1 / Math.max(d, 1e-3), cone = lit ? Math.max(0, (-(dx * HL.fwd.x + dy * HL.fwd.y + dz * HL.fwd.z) * inv - .9) / .1) * Math.max(0, 1 - d / 22) : 0, L = it.k * (.5 + .5 * Math.min(1, cone + (d < 3 ? .4 : 0)));
    const az = Math.atan2(dx, dz) - g.rotation.y, el = Math.atan2(dy, Math.hypot(dx, dz)), sz = it.size * (1 + d * .05);
    for (let j = 0; j < 2; j++) { const s = it.gl[j], ph = it.ph + j * 2.3; // blitzt auf, wenn der Blickwinkel über die Fläche streicht (Bewegung, Drehung), dazu ein seltenes Funkeln
      const f = Math.pow(Math.max(0, Math.sin(az * 7 + el * 11 + ph + t * .3)), 16), tw = Math.pow(Math.max(0, Math.sin(t * (1.1 + j * .6) + ph * 3)), 48), a = Math.min(1, (f + tw * .8) * L);
      s.visible = a > .02; if (s.visible) { s.material.opacity = a; s.scale.setScalar(sz * (.5 + 1.3 * a)); } }
    it.halo.material.opacity = L * (.2 + .06 * Math.sin(t * 2.1 + it.ph)) * Math.min(1, d / 1.5 + .3); it.halo.scale.setScalar(sz * 5); } }
function glanz_klang(x, y, z) { // leiser, kristalliner Ton: zwei hohe Spieluhr-Zungen (echte Aufnahmen), knapp versetzt
  try { const o = x !== undefined ? { x, y, z, ref: 2 } : {}; if (Audio.buf && Audio.buf.kb_spieluhr_A6) { Audio.play('kb_spieluhr_A6', { ...o, gain: .085, rate: 1.335, hp: 900 }); Audio.play('kb_spieluhr_E6', { ...o, gain: .06, rate: 2, delay: .085, hp: 900 }); }
    Audio.play('keys1', { ...o, gain: .07, rate: 2.1, dur: .2 }); } catch (e) {} }

// ---------------------------------------------------------------- Einbindung
if (typeof sammeln_platz === 'function') sammeln_platz = (o => function () { const O = o.apply(this, arguments); try { if (O && O.hit) { O.hit.userData.hl = 'sammlung'; O.hit.userData.hlObj = () => O.m && O.m.visible ? O.m : null; } } catch (e) {} return O; })(sammeln_platz);
WORLD_MODS.push(['Hervorhebung', async () => {
  try { const e0 = ECHO_CAST.end; ECHO_CAST.end = function (E) { const r = e0 ? e0.apply(this, arguments) : undefined; try { if (E && E.id === 'echo_kinderzimmer') nb_wissen(2); if (E && E.id === 'echo_mira') nb_wissen(3); } catch (e) {} return r; }; } catch (e) {}
  try { if (typeof k5_augenAuf === 'function') { const au0 = k5_augenAuf; k5_augenAuf = function (zwang) { if (zwang === true) try { nb_wissen(4); } catch (e) {} return au0.apply(this, arguments); }; } } catch (e) {} // nur der vollständige Stall (nach „War es schön? Mein Leben?“) ruft k5_augenAuf(true)
  try { if (settings.hl === undefined) settings.hl = 2; } catch (e) {}
  const mS = document.getElementById('mSet'); if (mS) mS.addEventListener('click', () => setTimeout(hl_einstellung, 0));
  try { if (typeof sammeln_S !== 'undefined') for (const O of Object.values(sammeln_S.orte)) if (O && O.hit) { O.hit.userData.hl = 'sammlung'; O.hit.userData.hlObj = () => O.m && O.m.visible ? O.m : null; } } catch (e) {}
  if (typeof klang_load === 'function') { klang_load('kb_spieluhr_A6'); klang_load('kb_spieluhr_E6'); }
  try { // Szenentiefe für den Verdeckungstest: Tiefentextur an beide Puffer des Composers (MSAA löst sie mit auf)
    for (const r of [composer.renderTarget1, composer.renderTarget2]) if (!r.depthTexture) { r.depthTexture = new THREE.DepthTexture(r.width, r.height, THREE.UnsignedIntType); r.dispose(); }
  } catch (e) { console.warn('Hervorhebung: keine Szenentiefe', e); }
  const W = composer.renderTarget1.width, H = composer.renderTarget1.height;
  HL.rt = new THREE.WebGLRenderTarget(Math.max(1, W), Math.max(1, H), { depthBuffer: false, type: THREE.UnsignedByteType }); HL.uRes.value.set(HL.rt.width, HL.rt.height);
  HL.scene = new THREE.Scene(); HL.scene.matrixWorldAutoUpdate = false;
  for (let i = 0; i < 10; i++) HL.slots.push({ o: null, k: 0, sel: false, d: 9, look: 0, ph: 0, cat: 'interakt', px: [], mat: hl_maskMat() });
  HL.mask = { enabled: true, needsSwap: false, clear: false, renderToScreen: false, render: hl_maske, dispose() {},
    setSize(w, h) { HL.rt.setSize(Math.max(1, w), Math.max(1, h)); HL.uRes.value.set(HL.rt.width, HL.rt.height); } };
  HL.glow = hl_glowPass(); HL.glow.uniforms.tMask.value = HL.rt.texture; HL.glow.enabled = false;
  composer.insertPass(HL.mask, 1);
  const P = composer.passes, io = P.findIndex(p => p.constructor && p.constructor.name === 'OutputPass'); composer.insertPass(HL.glow, io >= 0 ? io + 1 : Math.max(1, P.indexOf(filmPass)));
  HL.ready = true;
}]);
WORLD_TICK.push((dt, t) => {
  if (!HL.ready) return; HL.t = t; const aus = hl_aus(), mode = aus ? 0 : +(settings.hl ?? 2);
  const t0 = performance.now(); if (state.started) hl_scan(); HL.chk -= dt; if (HL.chk <= 0) { HL.chk = .2; if (mode) hl_waehle(); else for (let i = 0; i < HL.slots.length; i++) HL.slots[i].sel = false; } HL.ms = Math.max(HL.ms * .995, performance.now() - t0); // Messwert für Tests (gleitendes Maximum)
  const F = HL_STUFE[mode] || HL_STUFE[2]; let n = 0, best = 0;
  for (let i = 0; i < HL.slots.length; i++) { const s = HL.slots[i]; if (!s.o) continue; let kT = 0;
    if (mode && s.sel) kT = s.o === target ? F[0] : (s.d < 2.6 || s.look) ? F[1] : F[2] * Math.max(0, 1 - (s.d - 2.6) / 5.4);
    if (kT && s.cat === 'lesbar' && hl_benutzt(s.o)) kT *= HL_GELESEN;
    s.k += (kT - s.k) * Math.min(1, dt * (kT > s.k ? 4.5 : 7)); if (s.k < .004 && !kT) { hl_frei(s); continue; }
    s.mat.uniforms.k.value = s.k * (.82 + .18 * Math.sin(t * 2.2 + s.ph)); n++; if (s.k > best) best = s.k; }
  HL.aktiv = n; HL.glow.enabled = n > 0; HL.glow.uniforms.time.value = t; HL.glow.uniforms.asp.value = camera.aspect;
  if (!HL.legende && !aus && best > .45 && !(typeof subtitle === 'undefined')) hl_legende();
  if (!HL.nbGezeigt && !aus && state.started && (HL.nbT = (HL.nbT || 0) - dt) < 0) { HL.nbT = .5; hl_nachbild(); }
  glanz_tick(dt, t); try { gli_tick(dt, t, aus || !mode); } catch (e) {}
  if (HL.karte && HL.karteZu && (ui.overlay || state.talking || (typeof beutel_S !== 'undefined' && beutel_S.open) || (typeof kino_S !== 'undefined' && kino_S.on))) HL.karteZu(); // Tasche/Notiz/Film geht auf: Karte weicht
});
window.__hl = { HL, GLZ, kat: o => hl_kat(o), vis: o => hl_visuals(o), slots: () => HL.slots.filter(s => s.o).map(s => ({ label: (l => typeof l === 'function' ? l() : l)(s.o.userData.label), cat: s.cat, k: +s.k.toFixed(2), d: +(+s.d).toFixed(2), n: s.px.length })) }; // Testzugriff
