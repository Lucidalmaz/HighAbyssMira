// =====================================================================  FENSTERFIGUR (Modul „fensterfigur“, Nutzerauftrag 10.10.2026, Höchste Priorität A)
// Frau/Gestalt am Fenster (Kapitel 1, Nr. 3/5/7/8 u. a.): bisher eine flache, verwaschene Silhouette (Basis: Fläche „silhouette“, fassaden.js: Schatten-Maske im Scheinzimmer),
// die als Kopf mitten im Fenster schwebte und durch die Scheibe ragte. Jetzt: ein echter, vollständiger 3D-Körper (Menschenmodell aus figuren.js) steht im Zimmer HINTER dem Glas.
// Technik (wie ein Spiegel/Portal, kein Loch in der Wand nötig): die Figur lebt in einer eigenen kleinen Szene, steht dort an ihrer Weltposition (0,5 m hinter der Wand, Füße auf Zimmerboden,
// Körper unterhalb der Brüstung von der Wand verdeckt), und wird mit der Spielkamera in einen Zielpuffer gezeichnet. Eine Fläche genau in der Scheibenebene zeigt diesen Puffer
// bildschirmgenau – es entsteht also genau das Stück Figur, das durch die Öffnung sichtbar ist (Parallaxe, Tiefe, Selbstverdeckung, Nebel, Verdeckung durch Vordergrund bleiben richtig;
// Gardine und Glas liegen davor). Atmen und Kopfdrehung kommen aus figuren.js (Mikro-Schicht, Blick zur Kamera).
// Schnittstelle: ff_neu(parent, lx, ly, lz, ry, pw, ph, id, opt) → rec { fade, ziel, quad, fig }. Aufrufer: fassaden.js (S.figs), Basis-Ereignis „window“ (silhouette).
// Testzugriff: __fenster (FF, neu).
const FF = { scene: null, rt: null, hemi: null, key: null, warm: null, mat0: null, recs: [], n: 0, ms: 0, tmpV: new THREE.Vector3(), tmpV2: new THREE.Vector3(), cc: new THREE.Color(), sz: new THREE.Vector2(), sil: null, err: 0 };
function ff_init() {
  if (FF.scene) return true;
  try {
    FF.scene = new THREE.Scene();
    FF.hemi = new THREE.HemisphereLight(0x8c9fc4, 0x2a2420, .55); FF.key = new THREE.DirectionalLight(0xc8d4ff, .35); FF.key.position.set(0, 3, 6); FF.warm = new THREE.PointLight(0xffb070, 0, 5, 2);
    FF.scene.add(FF.hemi, FF.key, FF.key.target, FF.warm);
    renderer.getDrawingBufferSize(FF.sz);
    FF.rt = new THREE.WebGLRenderTarget(Math.max(64, FF.sz.x >> 1), Math.max(64, FF.sz.y >> 1), { type: THREE.HalfFloatType, samples: 2, depthBuffer: true });
    return true;
  } catch (e) { console.warn('Fensterfigur: Init', e); FF.scene = null; return false; }
}
const FF_VS = `varying vec4 vClip;\n#include <fog_pars_vertex>\nvoid main(){ vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition; vClip = gl_Position;\n#include <fog_vertex>\n}`;
const FF_FS = `uniform sampler2D tFig; uniform float uFade; varying vec4 vClip;\n#include <fog_pars_fragment>\nvoid main(){ vec2 uv = vClip.xy / vClip.w * .5 + .5; vec4 c = texture2D(tFig, uv); c *= uFade;\n#ifdef USE_FOG\n float ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth); c.rgb = mix(c.rgb, fogColor * c.a, ff);\n#endif\n gl_FragColor = c; }`;
function ff_mat(rec) {
  const m = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { tFig: { value: FF.rt.texture }, uFade: { value: 0 } }]), vertexShader: FF_VS, fragmentShader: FF_FS,
    transparent: true, depthWrite: false, fog: true, premultipliedAlpha: true, side: THREE.DoubleSide, name: 'ff_fenster' });
  m.uniforms.tFig.value = FF.rt.texture; // (UniformsUtils.merge klont keine Zielpuffer-Texturen: Wert dort null)
  m.blending = THREE.CustomBlending; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor; m.blendSrcAlpha = THREE.OneFactor; m.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
  return m;
}
// parent: Gruppe (Haus); (lx, ly, lz) Mitte der Scheibe in parent, ry Blickrichtung nach außen (parent-lokal); pw × ph Öffnung; id Figur; opt: { warm, boden, tief }
function ff_neu(parent, lx, ly, lz, ry, pw, ph, id, opt = {}) {
  if (!ff_init()) return null;
  const rec = { parent, lx, ly, lz, ry, pw, ph, id, fade: 0, ziel: 0, fig: null, wrap: null, quad: null, warm: opt.warm ? 1 : 0, boden: opt.boden ?? (ly - ph / 2 - .75), tief: opt.tief ?? .55, busy: false, alive: true, P: null };
  const q = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), ff_mat(rec)); q.position.set(lx, ly, lz); q.rotation.y = ry; q.renderOrder = 0; q.userData.noCol = true; q.frustumCulled = true; q.castShadow = q.receiveShadow = false;
  q.onBeforeRender = (r, sc, cam) => { try { ff_zeichne(rec, r, cam); } catch (e) { if (!FF.err) { FF.err = 1; console.warn('Fensterfigur: Zeichnen', e); } } };
  parent.add(q); rec.quad = q; FF.recs.push(rec);
  // Figur in der eigenen Szene (an der Weltposition hinter der Wand)
  (async () => {
    try {
      parent.updateWorldMatrix(true, false); const nx = Math.sin(ry), nz = Math.cos(ry);
      const wp = new THREE.Vector3(lx - nx * rec.tief, rec.boden, lz - nz * rec.tief); parent.localToWorld(wp);
      const dir = new THREE.Vector3(nx, 0, nz).transformDirection(parent.matrixWorld); const wy = Math.atan2(dir.x, dir.z);
      const wrap = new THREE.Group(); wrap.position.copy(wp); wrap.rotation.y = wy; wrap.visible = false; FF.scene.add(wrap);
      const g = new THREE.Group(); wrap.add(g);
      const P = await figuren_embody(g, id, {}); if (!P) { FF.scene.remove(wrap); rec.fail = true; return; }
      // von hinten beleuchtetes Zimmer: Figur dunkler, nie voll ausgeleuchtet
      g.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = o.receiveShadow = false; [].concat(o.material).forEach(m => { if (m && m.color) m.color.multiplyScalar(opt.dunkel ?? .72); }); } });
      P.look = 'cam'; if (P.mv) P.mv.autoLook = null; rec.P = P; rec.fig = g; rec.wrap = wrap;
      try { figuren_lookAt(P, 'cam', .65); } catch (e) {}
    } catch (e) { rec.fail = true; console.warn('Fensterfigur: Figur', id, e); }
  })();
  return rec;
}
function ff_zeichne(rec, r, cam) {
  rec.calls = (rec.calls || 0) + 1; if (!rec.wrap || rec.fade < .01 || FF.drawing) return; FF.drawing = true; rec.draws = (rec.draws || 0) + 1;
  const sz = r.getDrawingBufferSize(FF.sz); const tw = Math.max(64, Math.round(sz.x * .6)), th = Math.max(64, Math.round(sz.y * .6)); if (FF.rt.width !== tw || FF.rt.height !== th) FF.rt.setSize(tw, th);
  // nur diese Figur zeigen, warmes Rücklicht je nach Fenster
  for (const o of FF.recs) if (o.wrap) o.wrap.visible = (o === rec);
  rec.wrap.updateWorldMatrix(true, true);
  FF.warm.intensity = rec.warm ? 2.2 : 0; FF.warm.position.copy(rec.wrap.position); FF.warm.position.y += 1.7; FF.tmpV.set(0, 0, -1.1).applyAxisAngle(THREE.Object3D.DEFAULT_UP, rec.wrap.rotation.y); FF.warm.position.add(FF.tmpV);
  FF.key.position.set(cam.position.x, cam.position.y + 1, cam.position.z); FF.key.target.position.copy(rec.wrap.position);
  const rt0 = r.getRenderTarget(), ac = r.autoClear, ca = r.getClearAlpha(), sm = r.shadowMap.autoUpdate; r.getClearColor(FF.cc);
  const xr = r.xr.enabled; r.xr.enabled = false; r.shadowMap.autoUpdate = false;
  try { r.setRenderTarget(FF.rt); r.setClearColor(0x000000, 0); r.autoClear = true; r.clear(); r.render(FF.scene, cam); }
  finally { r.setRenderTarget(rt0); r.setClearColor(FF.cc, ca); r.autoClear = ac; r.shadowMap.autoUpdate = sm; r.xr.enabled = xr; for (const o of FF.recs) if (o.wrap) o.wrap.visible = false; FF.drawing = false; }
}
// Takt: Blende, Sichtbarkeit nach Entfernung
function ff_tick(dt) {
  const t0 = performance.now(), cam = camera.position;
  for (const rec of FF.recs) { if (!rec.quad) continue;
    rec.fade += (rec.ziel - rec.fade) * Math.min(1, dt * (rec.ziel > rec.fade ? .9 : 2.5));
    rec.quad.material.uniforms.uFade.value = rec.fade; rec.quad.visible = rec.fade > .01 && !!rec.wrap;
    if (rec.wrap) { rec.quad.getWorldPosition(FF.tmpV2); rec.dist = Math.hypot(FF.tmpV2.x - cam.x, FF.tmpV2.z - cam.z); }
    // Höhe einmal nachführen: Kopfmitte etwas über der Scheibenmitte (Brüstung verdeckt Rumpf und Beine, Kopf und Schultern stehen im Ausschnitt)
    if (rec.P && rec.wrap && !rec.hAdj && (rec.wait = (rec.wait || 0) + dt) > 1.2) { const hd = rec.P.rig && rec.P.rig.head;
      if (hd) { rec.wrap.updateWorldMatrix(true, true); hd.getWorldPosition(FF.tmpV); const want = FF.tmpV2.y + rec.ph * (rec.kopf ?? .12); const dy = Math.max(-.9, Math.min(.9, want - FF.tmpV.y)); rec.wrap.position.y += dy; rec.hAdj = 1; } else rec.hAdj = 1; }
  }
  FF.ms = performance.now() - t0;
}
WORLD_TICK.push(dt => { try { ff_tick(Math.min(dt, .1)); } catch (e) { if (!FF.err2) { FF.err2 = 1; console.warn('Fensterfigur: Takt', e); } } });
// ---------------------------------------------------------------- Basis-Ereignis „window“: die flache Silhouette (Plane, unscharfer Kopf + Rumpf) durch die Figur ersetzen
{ try { silhouette.material.visible = false; } catch (e) {}
  const WID = ['aydin', 'hilde', 'mama'];
  WORLD_TICK.push(dt => { try {
    const S = typeof silhouette !== 'undefined' ? silhouette : null; if (!S) return;
    const aktiv = S.visible && S.parent;
    if (aktiv && !FF.sil) { // Ereignis hat begonnen: Scheibe und Öffnung bestimmen
      const par = S.parent, n = new THREE.Vector3(Math.sin(S.rotation.y), 0, Math.cos(S.rotation.y)); const c = S.position.clone().addScaledVector(n, -.035); c.y += .12;
      let pw = .86, ph = 1.5, gl = c.clone().addScaledVector(n, .058);
      if (typeof fassaden_S !== 'undefined' && fassaden_S.windows) { let best = null, bd = .6; for (const w of fassaden_S.windows) { if (w.g !== par || !w.pw) continue; const d = Math.hypot(w.x - c.x, w.y - c.y, w.z - c.z); if (d < bd) { bd = d; best = w; } }
        if (best) { pw = best.pw; ph = best.ph; gl.set(best.x, best.y, best.z).addScaledVector(new THREE.Vector3(Math.sin(best.ry), 0, Math.cos(best.ry)), .058); } }
      const id = WID[Math.abs(Math.round(c.x * 3 + c.z * 5)) % WID.length];
      FF.sil = ff_neu(par, gl.x, gl.y, gl.z, S.rotation.y, pw, ph, id, { warm: true }); if (FF.sil) FF.sil.vonBasis = true;
    }
    if (FF.sil && FF.sil.vonBasis) { const rec = FF.sil;
      if (aktiv) rec.ziel = Math.max(0, Math.min(1, S.material.opacity / .92)); else { rec.ziel = 0; if (rec.fade < .02) { FF.recs.splice(FF.recs.indexOf(rec), 1); rec.quad.parent && rec.quad.parent.remove(rec.quad); if (rec.wrap) FF.scene.remove(rec.wrap); rec.alive = false; FF.sil = null; } }
    }
  } catch (e) { if (!FF.err3) { FF.err3 = 1; console.warn('Fensterfigur: Ereignis', e); } } });
}
window.__fenster = { FF, neu: ff_neu };
