// =====================================================================  FIGUREN (Modul „figuren“): echte Unreal-Figuren statt der Mannequin-Puppe
// Quelle: unreal/Export_Figuren.bat → game/assets/ue/chars/<rolle>/manifest.json  { "mesh": "0_mesh.glb", "anims": { "idle": "1_Idle.glb", "walk": …, "talk": … }, "yaw": 0 }
// Rollen: kind_junge, kind_maedchen (Echo-Kinder), erwachsener (Echo-Erwachsene), alter_mann (Lars Vegas).
// Fehlt eine Rolle, bleibt das bisherige Modell – das Spiel läuft unverändert.
const figuren_S = { cache: new Map(), sk: null, kids: [] };
async function figuren_load(role) {
  if (figuren_S.cache.has(role)) return figuren_S.cache.get(role);
  const p = (async () => { try {
    const base = 'assets/ue/chars/' + role + '/', r = await fetch(base + 'manifest.json'); if (!r.ok) return null; const man = await r.json();
    const g = await MSL.gl.loadAsync(base + man.mesh), clips = {};
    for (const [k, f] of Object.entries(man.anims || {})) { try { const a = await MSL.gl.loadAsync(base + f); if (a.animations[0]) { const c = a.animations[0].clone(); c.name = k; clips[k] = c; } } catch (e) { console.warn('Figur ' + role + ' Animation ' + k, e); } }
    for (const a of g.animations || []) { if (!clips.idle && /idle/i.test(a.name)) clips.idle = a; if (!clips.walk && /walk/i.test(a.name)) clips.walk = a; }
    return { scene: g.scene, clips, yaw: man.yaw || 0 };
  } catch (e) { return null; } })();
  figuren_S.cache.set(role, p); return p;
}
// Klon auf Zielhöhe, Füße auf 0, Blickrichtung +z (yaw aus dem Manifest gleicht die Export-Achse aus)
async function figuren_clone(F, height) {
  if (!figuren_S.sk) figuren_S.sk = (await import('three/addons/utils/SkeletonUtils.js')).clone;
  const o = figuren_S.sk(F.scene); o.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(o), s = height / Math.max(.01, bb.max.y - bb.min.y);
  o.scale.setScalar(s); o.position.y = -bb.min.y * s; o.rotation.y = F.yaw; o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; } });
  const w = new THREE.Group(); w.add(o); w.userData.noCol = true; return w;
}
// Geistermaterial, das die Textur (Gesicht, Kleidung) als Helligkeit durchscheinen lässt – statt eines einfarbigen Umrisses
function figuren_ghostMat(src) {
  const m = new THREE.MeshStandardMaterial({ map: src && src.map || null, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  m.onBeforeCompile = sh => { sh.uniforms.uGhost = FAB.ghostU || { value: 0 }; sh.fragmentShader = 'uniform float uGhost;\n' + sh.fragmentShader.replace('#include <dithering_fragment>',
    '#include <dithering_fragment>\n float frG = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.2);\n float lum = dot(diffuseColor.rgb, vec3(.3, .59, .11));\n gl_FragColor = vec4((vec3(.55, .74, 1.) * (.1 + 1.5 * frG) + vec3(.82, .9, 1.) * lum * .95) * uGhost, 1.);'); };
  m.customProgramCacheKey = () => 'figuren_ghost'; return m;
}
WORLD_MODS.push(['Figuren', async () => {
  const boy = await figuren_load('kind_junge'), girl = await figuren_load('kind_maedchen'), adult = await figuren_load('erwachsener');
  const kids = [boy, girl].filter(Boolean); if ((!kids.length && !adult) || !FAB.figs) return;
  let n = 0;
  for (const g of echoFigs) {
    const F = FAB.figs.find(x => x.g === g); if (!F) continue;
    const add = async (src, which) => { const w = await figuren_clone(src, 1.94); w.traverse(m => { if (m.isMesh) { m.material = [].concat(m.material).map(figuren_ghostMat); if (m.material.length === 1) m.material = m.material[0]; m.castShadow = false; } });
      w.visible = false; g.add(w); const mx = new THREE.AnimationMixer(w.children[0]); const idle = src.clips.idle && mx.clipAction(src.clips.idle); if (idle) { idle.play(); mx.update(Math.random() * 3); idle.timeScale = .85 + Math.random() * .25; }
      figuren_S.kids.push({ g, w, mx, which, orig: F }); };
    if (kids.length) await add(kids[n++ % kids.length], 'kind');
    if (adult) await add(adult, 'erw');
  }
}]);
// Pro Bild: sichtbare Echo-Gestalt je nach Größe (Kind < 0,8) auf das passende echte Modell umschalten, Animation weiterlaufen lassen
// auch direkt aufrufbar (z. B. vor einem Foto, das zwischen zwei Bildern gerendert wird)
function figuren_sync(dt = 0) {
  for (const K of figuren_S.kids) {
    const kid = K.g.scale.x < .8, want = K.g.visible && (K.which === 'kind' ? kid : !kid); K.w.visible = want;
    const other = K.g.children.find(c => c !== K.w && !figuren_S.kids.some(x => x.w === c) && c.isObject3D && c.type !== 'Mesh'); // das Mannequin
    if (other && K.g.visible) other.visible = !figuren_S.kids.some(x => x.g === K.g && x.w.visible);
    if (want && dt) K.mx.update(dt);
  }
}
WORLD_TICK.push(dt => figuren_sync(dt));
