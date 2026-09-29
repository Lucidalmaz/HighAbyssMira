// =====================================================================  KAMERA (Modul „kamera“, W2-P9): Hildes Polaroid-Kamera – nur Kapitel 5
// „Die Kamera lügt nicht. Menschen schon. – H.“  Taste C hebt die Kamera (Sucher), Klick löst aus: Blitz, das Bild wird EINMAL im Blitz-Moment
// in eine kleine Textur gerendert (400 × 300, Technik wie zayn_takePhotos), das Polaroid schiebt sich heraus und entwickelt sich in 4 s in der Hand.
// Schnittstelle (produktion_welle2.md §1.4):
//   kamera_frei(n)   → Kamera mit n Bildern ins Inventar ('polaroid_kamera'), Taste C
//   kamera_film(+n)  → Film nachlegen
//   kamera_ziel(fn)  → fn(camera) → { vorFoto(), nachFoto(), text, sperre?: 'weggedreht' } für die aktuelle Blickrichtung oder null
//                      zusätzlich (optional): beimHeben() – beim Heben der Kamera; nachEntwickeln(url) – wenn das Bild fertig ist; stempel – Text am Rand
// Kein Licht zur Laufzeit: der Blitz ist ein weißes Bild-Overlay plus kurz verstärkte vorhandene Lichter (Taschenlampe, Himmel) nur im Foto-Frame.
const kamera_S = { frei: false, film: 0, hoch: false, hochK: 0, busy: false, ziel: null, fotos: [], n: 0, rt: null, pc: null, buf: null, cv: null, el: {}, sperre: null, tipT: 0, zeigT: 0 };
function kamera_desc() { const n = kamera_S.film; return `Hildes Sofortbildkamera, eine alte Polaroid. Zählwerk: ${n}. [C] heben · Klick auslösen.` + (n ? '' : ' Kein Film mehr.'); }
function kamera_item() { try { modItem('polaroid_kamera', 'Hildes Kamera', kamera_desc(), 'polaroid'); } catch (e) {} }
function kamera_frei(n = 3) {
  const S = kamera_S; S.frei = true; S.film = Math.max(0, n | 0); kamera_item(); addItem('polaroid_kamera'); kamera_hud();
  kamera_tip('<kbd>C</kbd> Kamera heben · <kbd>Klick</kbd> auslösen · ' + S.film + (S.film === 1 ? ' Bild' : ' Bilder'), 7000);
}
function kamera_film(n = 1) { const S = kamera_S; S.film = Math.max(0, S.film + n); kamera_item(); kamera_hud(); }
function kamera_ziel(fn) { kamera_S.ziel = typeof fn === 'function' ? fn : null; }
function kamera_zu() { if (kamera_S.hoch) kamera_heben(false); } // für Szenen, die die Kamera senken
// ---------------------------------------------------------------- Aussehen (Sucher, Blitz, Polaroid in der Hand)
{
  const css = document.createElement('style');
  css.textContent = `
  #kamSucher { position: fixed; inset: 0; pointer-events: none; opacity: 0; transition: opacity .28s; z-index: 3; }
  #kamSucher.on { opacity: 1; }
  #kamSucher .vig { position: absolute; inset: 0; background: radial-gradient(ellipse 58% 62% at 50% 48%, rgba(0,0,0,0) 62%, rgba(0,0,0,.55) 80%, rgba(0,0,0,.94) 100%); }
  #kamSucher .rah { position: absolute; left: 50%; top: 48%; width: min(62vw, 110vh); aspect-ratio: 4 / 3; transform: translate(-50%, -50%); border: 1px solid rgba(235,228,210,.28); box-shadow: 0 0 0 200vmax rgba(0,0,0,.34); }
  #kamSucher .rah::before, #kamSucher .rah::after { content: ''; position: absolute; left: 50%; top: 50%; background: rgba(235,228,210,.35); transform: translate(-50%, -50%); }
  #kamSucher .rah::before { width: 22px; height: 1px; } #kamSucher .rah::after { width: 1px; height: 22px; }
  #kamSucher .zw { position: absolute; right: 10px; bottom: 8px; font: 600 15px "Special Elite", monospace; color: #e8a060; text-shadow: 0 0 6px rgba(255,120,40,.6); letter-spacing: .1em; }
  #kamSucher .sp { position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%); font: italic 15px "Cormorant Garamond", Georgia, serif; color: #d8cfb8; opacity: 0; transition: opacity .4s; white-space: nowrap; text-shadow: 0 0 6px #000; }
  #kamSucher .sp.on { opacity: 1; }
  #kamBlitz { position: fixed; inset: 0; pointer-events: none; background: #fffaf0; opacity: 0; z-index: 4; }
  #kamPola { position: fixed; left: 50%; bottom: 6vh; width: 34vh; box-sizing: border-box; pointer-events: none; z-index: 4; opacity: 0; transform: translate(-50%, 110%) rotate(-2.2deg);
    transition: transform 1.1s cubic-bezier(.2,.8,.25,1), opacity .5s; background: linear-gradient(170deg, #f3efe6, #e4ddcf); padding: 5.5% 5.5% 20% 5.5%; box-shadow: 0 16px 40px rgba(0,0,0,.65), 0 0 0 1px rgba(0,0,0,.25); }
  #kamPola.raus { opacity: 1; transform: translate(-50%, 0) rotate(-2.2deg); }
  #kamPola .bild { position: relative; width: 100%; height: 22.7vh; background: #1b1d1a; overflow: hidden; }
  #kamPola img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; filter: contrast(.6) saturate(.2) brightness(.5) sepia(.3); }
  #kamPola .chem { position: absolute; inset: 0; background: radial-gradient(ellipse at 40% 45%, #3c4239, #262a26 70%); }
  #kamPola.dev img { opacity: 1; filter: none; transition: opacity 2.6s .4s, filter 4s ease-out; }
  #kamPola.dev .chem { opacity: 0; transition: opacity 3.6s .2s; }
  #kamPola .hand { position: absolute; left: 7%; right: 7%; bottom: 3%; font: 22px Caveat, "Comic Sans MS", cursive; color: #2a2a3a; opacity: 0; transition: opacity 1.2s 3.4s; text-align: center; }
  #kamPola.dev .hand { opacity: .85; }
  #kamTip { position: absolute; right: 34px; bottom: 118px; font: 600 12px "Cormorant Garamond", Georgia, serif; letter-spacing: .22em; color: #d9cdb2; text-shadow: 0 0 4px #000, 0 0 12px #000; opacity: 0; transition: opacity .8s; text-align: right; }
  #kamTip.on { opacity: 1; } #kamTip kbd { font: 600 11px Georgia; border: 1px solid rgba(201,163,106,.6); padding: 1px 6px; margin: 0 3px; color: var(--gold, #c9a36a); border-radius: 2px; }`;
  document.head.appendChild(css);
  const mk = (id, par, html) => { const d = document.createElement('div'); d.id = id; if (html) d.innerHTML = html; par.appendChild(d); return d; };
  const hud = document.getElementById('hud') || document.body;
  kamera_S.el.sucher = mk('kamSucher', document.body, '<div class="vig"></div><div class="rah"><div class="zw"></div></div><div class="sp"></div>');
  kamera_S.el.blitz = mk('kamBlitz', document.body);
  kamera_S.el.pola = mk('kamPola', document.body, '<div class="bild"><img alt=""><div class="chem"></div></div><div class="hand"></div>');
  kamera_S.el.tip = mk('kamTip', hud);
}
function kamera_hud() { const S = kamera_S; S.el.sucher.querySelector('.zw').textContent = String(S.film).padStart(2, '0'); }
function kamera_tip(html, ms = 5000) { const t = kamera_S.el.tip; t.innerHTML = html; t.classList.add('on'); clearTimeout(kamera_S.tipTo); kamera_S.tipTo = setTimeout(() => t.classList.remove('on'), ms); }
function kamera_sperrText(txt) { const sp = kamera_S.el.sucher.querySelector('.sp'); sp.textContent = txt || ''; sp.classList.toggle('on', !!txt); }
// ---------------------------------------------------------------- Heben / Senken
function kamera_darf() { return kamera_S.frei && state.started && !ui.overlay && !ui.paused && !state.ending && !(typeof tod_S !== 'undefined' && tod_S.dying) && !(typeof kino_busy === 'function' && kino_busy()); }
function kamera_heben(on = !kamera_S.hoch) {
  const S = kamera_S; if (on && (!kamera_darf() || state.talking || S.busy)) return false;
  if (on === S.hoch) return true; S.hoch = on; S.el.sucher.classList.toggle('on', on); kamera_hud(); kamera_sperrText('');
  if (Audio.ctx) { const o = Audio.osc('square', on ? 1900 : 1500, 0, .05); Audio.env(o, .025, .002, .03); const n = Audio.noise(false), bp = Audio.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 2; n.connect(bp); Audio.env(bp, .05, .01, .12); n.stop(Audio.ctx.currentTime + .3); }
  if (on) { S.sperre = null; const Z = kamera_zielJetzt(); if (Z && Z.beimHeben) { try { Z.beimHeben(); } catch (e) { console.warn('Kamera: beimHeben', e); } }
    if (Z && Z.sperre) { S.sperre = Z; kamera_sperrText(Z.sperrText || ''); } }
  return true;
}
function kamera_zielJetzt() { const S = kamera_S; if (!S.ziel) return null; try { return S.ziel(camera) || null; } catch (e) { console.warn('Kamera: Ziel', e); return null; } }
// ---------------------------------------------------------------- Auslösen
async function kamera_ausloesen() {
  const S = kamera_S; if (!S.hoch || S.busy || !kamera_darf()) return false;
  const Z = kamera_zielJetzt();
  if (Z && Z.sperre) { // „weggedreht“: löst nicht aus, kein Film verbraucht
    Audio.beep(false); kamera_sperrText(Z.sperrText || 'Der Auslöser klemmt.'); if (Z.beiSperre) { try { Z.beiSperre(); } catch (e) {} } return false; }
  if (S.film <= 0) { Audio.beep(false); toast('Das Zählwerk steht auf null. Kein Film mehr.', 3000); return false; }
  S.busy = true; S.film--; kamera_item(); kamera_hud(); S.n++;
  let url = null;
  try { if (Z && Z.vorFoto) Z.vorFoto(); } catch (e) { console.warn('Kamera: vorFoto', e); }
  try { url = kamera_render(Z && Z.stempel); } catch (e) { console.warn('Kamera: Bild', e); }
  try { if (Z && Z.nachFoto) Z.nachFoto(); } catch (e) { console.warn('Kamera: nachFoto', e); }
  kamera_blitz(); S.fotos.push({ url, text: Z ? Z.text || '' : '' });
  // Surren: das Bild wird ausgeworfen
  if (Audio.ctx) { const o = Audio.osc('sawtooth', 110, .18, 1.1), lp = Audio.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; o.connect(lp); Audio.env(lp, .035, .05, 1, .18); }
  await wait(380); kamera_heben(false); S.busy = true;
  const P = S.el.pola, img = P.querySelector('img'); P.classList.remove('dev', 'raus'); P.querySelector('.hand').textContent = Z && Z.hand ? Z.hand : '';
  if (url) img.src = url; void P.offsetWidth; P.classList.add('raus');
  await wait(900); P.classList.add('dev'); // 4 s Entwicklung in der Hand
  await wait(4200);
  if (Z && Z.text) subtitle(Z.text, Math.max(4200, readMs(Z.text)));
  if (Z && Z.nachEntwickeln) { try { await Z.nachEntwickeln(url); } catch (e) { console.warn('Kamera: nachEntwickeln', e); } }
  S.zeigT = Z && Z.halten ? Z.halten : 3.5; S.busy = false; return true;
}
// Blitz: weißes Bild, das in ~0,4 s abklingt; der Knall der Birne
function kamera_blitz() {
  const b = kamera_S.el.blitz; b.style.transition = 'none'; b.style.opacity = .96; void b.offsetWidth; b.style.transition = 'opacity .55s ease-out'; b.style.opacity = 0;
  if (Audio.ctx) { const n = Audio.noise(false), hp = Audio.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800; n.connect(hp); Audio.env(hp, .16, .002, .06); n.stop(Audio.ctx.currentTime + .3);
    const o = Audio.osc('sine', 5200, 0, .25); Audio.env(o, .02, .001, .2); }
  if (typeof leben_crowScare === 'function') { try { leben_crowScare(player.pos.x, player.pos.z, 14); } catch (e) {} }
}
// Einmal im Blitz-Moment in eine kleine Textur rendern (Ziel-Objekte sind in vorFoto schon gesetzt) → Polaroid-Abzug (Daten-URL)
function kamera_render(stamp) {
  const S = kamera_S, T = THREE, W = 400, H = 300;
  if (!S.rt) { S.rt = new T.WebGLRenderTarget(W, H); S.pc = new T.PerspectiveCamera(60, W / H, .08, 180); S.buf = new Uint8Array(W * H * 4); S.cv = document.createElement('canvas'); S.cv.width = W; S.cv.height = H; }
  const pc = S.pc; camera.updateMatrixWorld(true); pc.position.setFromMatrixPosition(camera.matrixWorld); pc.quaternion.setFromRotationMatrix(camera.matrixWorld); pc.fov = Math.min(64, camera.fov * .92); pc.updateProjectionMatrix(); pc.updateMatrixWorld(true);
  const hemi0 = hemi.intensity, fog0 = scene.fog ? scene.fog.density : 0, fl0 = flashlight.intensity, fr = { p: flashRig.position.clone(), q: flashRig.quaternion.clone() };
  try {
    hemi.intensity = hemi0 * 2.6 + .12; if (scene.fog) scene.fog.density = fog0 * .6; // der Blitz hellt auf, was vor der Linse steht
    flashRig.position.copy(pc.position); flashRig.quaternion.copy(pc.quaternion); flashRig.updateMatrixWorld(true); flashlight.intensity = Math.max(fl0, 14) * 2.4;
    renderer.setRenderTarget(S.rt); renderer.clear(); renderer.render(scene, pc); renderer.readRenderTargetPixels(S.rt, 0, 0, W, H, S.buf);
  } finally { renderer.setRenderTarget(null); hemi.intensity = hemi0; if (scene.fog) scene.fog.density = fog0; flashlight.intensity = fl0; flashRig.position.copy(fr.p); flashRig.quaternion.copy(fr.q); flashRig.updateMatrixWorld(true); }
  return kamera_print(S.buf, W, H, stamp);
}
// Rohbild (linear, kopfüber) → Sofortbild: Belichtung mit hartem Blitz-Abfall, angehobene Schwärzen, kalt-grüne Schatten, warme Lichter, Vignette, Korn
function kamera_print(buf, W, H, stamp) {
  const c = kamera_S.cv, x = c.getContext('2d'), im = x.createImageData(W, H), d = im.data;
  for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
    const s = ((H - 1 - y) * W + i) * 4, t = (y * W + i) * 4, vx = i / W - .5, vy = y / H - .5, r2 = vx * vx + vy * vy, vig = 1 - r2 * 1.9, n = (Math.random() - .5) * 18;
    const r = buf[s] / 255, g = buf[s + 1] / 255, b = buf[s + 2] / 255, L = r * .3 + g * .59 + b * .11;
    for (let k = 0; k < 3; k++) { let v = [r, g, b][k]; v = v * .82 + L * .18; v = Math.pow(Math.min(1, v * 2.4), 1 / 2.2); // leicht entsättigt, Gamma
      v = .07 + v * .86; v = v + (k === 1 ? .02 : k === 2 ? .015 : 0) * (1 - v) - (k === 2 ? .05 : 0) * v; // Schatten grünlich-kalt, Lichter warm
      d[t + k] = Math.max(0, Math.min(255, v * 255 * vig + n)); }
    d[t + 3] = 255; }
  x.putImageData(im, 0, 0);
  if (stamp) { x.font = 'bold 15px monospace'; x.fillStyle = 'rgba(255,150,50,.8)'; x.fillText(stamp, W - 14 - x.measureText(stamp).width, H - 12); }
  return c.toDataURL('image/jpeg', .86);
}
// ---------------------------------------------------------------- Eingabe
KEY_HOOKS.KeyC = () => { if (kamera_S.frei) kamera_heben(); };
addEventListener('mousedown', e => { if (e.button !== 0 || !kamera_S.hoch) return; if (document.pointerLockElement !== renderer.domElement && !window.__testMove) return; if (ui.overlay || ui.paused) return; kamera_ausloesen(); });
MOD_SAVE.push(['kamera', () => ({ frei: kamera_S.frei, film: kamera_S.film, n: kamera_S.n }), v => { kamera_S.frei = !!v.frei; kamera_S.film = v.film | 0; kamera_S.n = v.n | 0; if (kamera_S.frei) setTimeout(kamera_item, 0); }]);
WORLD_MODS.push(['Kamera', async () => {
  window.__kamera = { S: kamera_S, frei: kamera_frei, film: kamera_film, ziel: kamera_ziel, heben: kamera_heben, ausloesen: kamera_ausloesen, zu: kamera_zu }; // Testzugriff
}]);
WORLD_TICK.push(dt => {
  const S = kamera_S; if (!S.frei) return;
  if (S.hoch && (!kamera_darf() || state.talking)) kamera_heben(false); // Dialog, Notiz, Tod, Kino: Kamera runter
  if (S.hoch) { S.tipT -= dt; if (S.tipT <= 0) { S.tipT = .25; const Z = kamera_zielJetzt(); const sp = Z && Z.sperre ? Z : null; if (sp !== S.sperre) { S.sperre = sp; kamera_sperrText(sp ? sp.sperrText || '' : ''); if (sp && sp.beimHeben) { try { sp.beimHeben(); } catch (e) {} } } } }
  if (S.zeigT > 0) { S.zeigT -= dt; if (S.zeigT <= 0) S.el.pola.classList.remove('raus'); }
});
