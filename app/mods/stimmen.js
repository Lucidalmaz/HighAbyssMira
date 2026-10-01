// =====================================================================  STIMMEN (Modul „stimmen“, X-1 Sprachausgabe)
// Zu jeder gesprochenen Zeile die vorab erzeugte Aufnahme (Qwen3-TTS, eine feste Referenzstimme je Figur): game/assets/stimmen/<id>.opus, −16 LUFS.
// Zuordnung über den Text: subtitle(t, ms, who) → Normtext (ohne Tags/Anführungszeichen) → Manifest (Text → Zeilen, Anzeigename → Stimme). Untertitel bleiben.
// Gedanken (Sprecher 'LUKE') und Erzählung (ohne Sprecher) bleiben stumm; 'DU' = Luke spricht. Zeilen ohne gute Aufnahme fehlen im Manifest → nur Untertitel.
// Hook stimmen_spielen(key, pos): Traum, Wendigo-Stimmen, Pell-Band, Whiskey-Nachahmung geben Ort/Schlüssel; Rückgabe true = Stimme läuft (Rückfall-Klang entfällt).
// Wege: in der Welt räumlich (Audio.at → Welt-Bus mit Raumhall aus klang/Basis) · ohne Ort mittig über den Welt-Bus (Raumhall) · Funk/Telefon/Band/Mailbox
// trocken mit Bandpass 300–3400 Hz und leichter Sättigung · Luna mit leiser Spieluhr darunter · gefressene Stimmen („?“) trocken, ohne Raum · Whiskey: Rabenmund.
// Laden: Manifest beim Start (fetch), Dateien erst beim ersten Abspielen (fetch + decodeAudioData), say() lädt seine nächsten Zeilen vor. Kein base64.
// Mund: Hüllkurve der laufenden Stimme → stimmen_pegel() / figuren_mund(stimme, pegel), falls das Figuren-Modul ihn anbietet.
const ST = { man: null, wer: {}, buf: {}, lade: {}, cur: [], pend: null, pos: null, posT: -9, env: 0, stimme: '', ana: null, tmp: null, fehl: 0 };
const ST_PFAD = 'assets/stimmen/';
const st_norm = t => String(t == null ? '' : t).replace(/<[^>]*>/g, '').replace(/[„“”"‚‘»«]/g, '').replace(/\s+/g, ' ').trim();
const st_an = () => { try { return settings.stimmen !== false; } catch (e) { return true; } };
const st_vol = () => { try { return settings.stimmenVol ?? 1; } catch (e) { return 1; } };
const ST_FUNK = /FUNK|TELEFON|MAILBOX|BAND|RADIO|ANRUF|LAUTSPRECHER|AMTSSTIMME|KANAL|MHz/i;

function st_ladeManifest() { if (ST.man || ST.manP) return ST.manP;
  return ST.manP = fetch(ST_PFAD + 'manifest.json').then(r => r.ok ? r.json() : null).then(m => { if (m && m.z) { ST.man = m; ST.wer = m.wer || {}; } return ST.man; }).catch(() => null); }
function st_lade(id) { const Z = ST.man && ST.man.z[id]; if (!Z || !Audio.ctx) return Promise.resolve(null); if (ST.buf[id]) return Promise.resolve(ST.buf[id]); if (ST.lade[id]) return ST.lade[id];
  return ST.lade[id] = fetch(ST_PFAD + Z[0]).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); }).then(ab => Audio.ctx.decodeAudioData(ab))
    .then(b => { ST.buf[id] = b; return b; }).catch(e => { ST.fehl++; console.warn('Stimme fehlt: ' + id, e && e.message); return null; }); }
// Zeile → IDs (gestapelte Wendigo-Zeilen liefern mehrere). who entscheidet, wenn derselbe Text mehrfach besetzt ist.
function st_finde(t, who) { const M = ST.man; if (!M) return null; const L = M.t[st_norm(t)]; if (!L || !L.length) return null;
  const s = ST.wer[who] || ST.wer[st_norm(who)]; if (s && s.includes('+')) { const ids = s.split('+').map(v => L.find(i => M.z[i][2] === v)).filter(Boolean); return ids.length ? ids : null; }
  const id = s ? L.find(i => M.z[i][2] === s) : who ? null : L[0]; return id ? [id] : null; } // unbekannter Sprecher → stumm (keine fremde Stimme)
function stimmen_dauer(t, who) { if (!st_an()) return 0; const ids = st_finde(t, who); return ids ? Math.max(...ids.map(i => ST.man.z[i][1])) : 0; }
function stimmen_pegel() { return ST.env; }
function stimmen_sprecher() { return ST.cur.length ? ST.stimme : ''; }

// ---------------------------------------------------------------- Abspielen
function st_ziel(c, art, pos, gain) { const A = Audio, g = c.createGain(); g.gain.value = gain;
  if (art === 'funk') { const hp = c.createBiquadFilter(), lp = c.createBiquadFilter(), pk = c.createBiquadFilter(), ws = c.createWaveShaper();
    hp.type = 'highpass'; hp.frequency.value = 320; hp.Q.value = .8; lp.type = 'lowpass'; lp.frequency.value = 3300; lp.Q.value = .9; pk.type = 'peaking'; pk.frequency.value = 1700; pk.gain.value = 5; pk.Q.value = 1;
    if (!ST.kurve) { const n = 1024, k = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; k[i] = Math.tanh(x * 2.2) / Math.tanh(2.2); } ST.kurve = k; } ws.curve = ST.kurve;
    g.connect(hp); hp.connect(pk); pk.connect(lp); lp.connect(ws); let out = A.master; if (pos) { out = A.at(pos[0], pos[1], pos[2], 2.2); if (A.cut) out = A.master; } ws.connect(out); return g; }
  if (art === 'rabe') { const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = .9; g.connect(bp);
    const out = pos ? A.at(pos[0], pos[1], pos[2], 2) : A.world; bp.connect(out); return g; }
  if (art === 'trocken') { const p = c.createPanner(); p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = 3; p.rolloffFactor = 1;
    const q = pos || [camera.position.x, camera.position.y, camera.position.z - .5]; if (p.positionX) { p.positionX.value = q[0]; p.positionY.value = q[1]; p.positionZ.value = q[2]; } else p.setPosition(q[0], q[1], q[2]);
    g.connect(p); p.connect(A.master); return g; }
  if (pos) { const p = A.at(pos[0], pos[1], pos[2], 2.4); g.connect(p); return g; }
  g.connect(A.world); return g; }
function st_art(who, stimme, key) {
  if (key && /^whiskey_/.test(key) || /^WHISKEY/.test(who || '')) return 'rabe';
  if (ST_FUNK.test(who || '') || stimme === 'funk_blechmann' || stimme === 'lautsprecher' || stimme === 'radio' || stimme === 'kuehn' || stimme === 'jonas') return 'funk';
  if (/\?$|\? ·/.test(who || '') && /LUCYS|HOFER|ANNI|PELL|DEINE|JUSTINS/.test(who || '')) return 'trocken';
  return 'welt'; }
// Ort einer Figur in der Welt (für Zeilen ohne Hook-Ort); null = mittig
function st_ort(stimme) { try {
  if (typeof kino_S !== 'undefined' && kino_S.on) return null;
  let p = null, y = 0;
  if (stimme === 'vegas' && typeof albers_S !== 'undefined' && albers_S.open) { p = albers_S.door; y = p.y; } // Türspalt in Mundhöhe
  else if (stimme === 'justin' && typeof justin_da === 'function' && justin_da()) p = justin.g.position;
  else if (typeof LWO !== 'undefined' && LWO.F) { const F = LWO.F[{ nachsorge11: 'n11', nachsorge12: 'n12', wolter: 'wolter' }[stimme]]; if (F && F.g && F.g.visible) p = F.g.position; }
  if (!p) return null; if (!y) y = (p.y || 0) + 1.6; // Füße → Mund
  return Math.hypot(p.x - camera.position.x, p.z - camera.position.z) < 18 ? [p.x, y, p.z] : null; } catch (e) { return null; } }
function st_stop(fade = .12) { const c = Audio.ctx; if (!c) return; ST.halt = null; const t = c.currentTime; for (const h of ST.cur) { try { h.g.gain.cancelScheduledValues(t); h.g.gain.setValueAtTime(h.g.gain.value, t); h.g.gain.linearRampToValueAtTime(0, t + fade); h.src.stop(t + fade + .02); } catch (e) {} if (h.box) try { h.box.gain.setTargetAtTime(0, t, .1); } catch (e) {} } ST.cur.length = 0; }
async function st_spiele(ids, who, pos, key) { const A = Audio, c = A.ctx; if (!c || !ids || !ids.length || !st_an()) return false;
  ST.zuletzt = { ids, t: performance.now() };
  const bufs = await Promise.all(ids.map(st_lade)); if (!bufs.some(Boolean)) return false;
  const stimme = ST.man.z[ids[0]][2], art = who ? st_art(who, stimme, key) : ST.man.z[ids[0]][3] || st_art(who, stimme, key), wo = art === 'funk' && !pos ? null : (pos || (art === 'welt' ? st_ort(stimme) : null));
  // Sprecherwechsel: läuft die vorige Zeile nur noch kurz, wartet die neue (natürlicher Wechsel); sonst weich abblenden
  let t0 = c.currentTime + .03; const rest = ST.cur.reduce((m, h) => Math.max(m, h.ende - c.currentTime), 0);
  if (rest > 0 && rest < 1.4) t0 += rest + .12; else st_stop();
  if (!ST.ana) { ST.ana = c.createAnalyser(); ST.ana.fftSize = 512; ST.tmp = new Float32Array(ST.ana.fftSize); }
  const vol = st_vol() * (art === 'funk' ? .8 : art === 'trocken' ? .85 : stimme === 'luke' && !wo ? .85 : 1); // die eigene Stimme etwas zurück
  bufs.forEach((b, i) => { if (!b) return; const src = c.createBufferSource(); src.buffer = b; if (art === 'rabe') src.playbackRate.value = 1.12;
    const g = st_ziel(c, art, wo, vol * (ids.length > 1 ? [1, .8, .7][i] || .6 : 1)); src.connect(g); src.connect(ST.ana); const ts = t0 + i * [0, .05, .11][Math.min(i, 2)];
    src.start(ts); const h = { src, g, ende: ts + b.duration / src.playbackRate.value, id: ids[i], b, t0: ts, rate: src.playbackRate.value }; src.onended = () => { if (ST.halt) return; const k = ST.cur.indexOf(h); if (k >= 0) ST.cur.splice(k, 1); }; ST.cur.push(h); });
  // Luna: leise Spieluhr darunter (gleiche Zinken wie im Amt)
  if (stimme === 'luna' && art !== 'funk' && typeof lucy3_tines === 'function') try { const bg = c.createGain(); bg.gain.value = .32 * st_vol(); bg.connect(wo ? A.at(wo[0], wo[1], wo[2], 2.4) : A.world); lucy3_tines(bufs[0].duration + .4, bg, .5); if (ST.cur[0]) ST.cur[0].box = bg; } catch (e) {}
  ST.stimme = stimme; ST.art = art + (wo ? '@' + wo.map(v => v.toFixed(1)).join(',') : ''); return true; }

// Pause (ESC): Stimmen anhalten und an derselben Stelle fortsetzen (Untertitel stehen in der Pause ebenfalls)
function st_pause() { const c = Audio.ctx; if (!c) return; const p = typeof ui !== 'undefined' && ui.paused;
  if (p && ST.cur.length && !ST.halt) { ST.halt = ST.cur.map(h => ({ h, off: Math.max(0, (c.currentTime - h.t0) * h.rate) })); for (const x of ST.halt) { x.h.src.onended = null; try { x.h.src.stop(); } catch (e) {} } }
  else if (!p && ST.halt) { const L = ST.halt; ST.halt = null; const t = c.currentTime + .02;
    for (const { h, off } of L) { if (off >= h.b.duration - .05) { const k = ST.cur.indexOf(h); if (k >= 0) ST.cur.splice(k, 1); continue; }
      const src = c.createBufferSource(); src.buffer = h.b; src.playbackRate.value = h.rate; src.connect(h.g); src.connect(ST.ana); src.start(t, off);
      h.src = src; h.t0 = t - off / h.rate; h.ende = t + (h.b.duration - off) / h.rate; src.onended = () => { if (ST.halt) return; const k = ST.cur.indexOf(h); if (k >= 0) ST.cur.splice(k, 1); }; } } }
setInterval(() => { try { st_pause(); } catch (e) {} }, 150);

// Untertitel-Haken: spielt die Zeile einen Takt später (ein folgender stimmen_spielen-Aufruf derselben Zeile liefert noch den Ort)
function stimmen_zeile(t, who) { if (!ST.man || !st_an() || !t) return; who = who || ''; if (who === 'LUKE') return;
  const ids = st_finde(t, who); if (!ids) return;
  const Z = ST.zuletzt; if (Z && performance.now() - Z.t < 500 && ids.every(i => Z.ids.includes(i))) return; // schon über den Hook gestartet
  const P = ST.pend = { ids, who, pos: performance.now() - ST.posT < 200 ? ST.pos : null };
  setTimeout(() => { if (ST.pend !== P) return; ST.pend = null; st_spiele(P.ids, P.who, P.pos); }, 0); }
// Hook der Module: Ort (Array [x,y,z] oder {x,y,z}) und/oder eigener Schlüssel. true = Stimme läuft/kommt.
function stimmen_spielen(key, pos) { if (!ST.man || !st_an()) return false; const q = pos ? (Array.isArray(pos) ? pos : [pos.x, pos.y ?? 1.6, pos.z]) : null;
  ST.pos = q; ST.posT = performance.now();
  if (ST.pend) { ST.pend.pos = q || ST.pend.pos; return true; }                        // Untertitel kam zuerst (Traum): Ort nachreichen
  const k = ST.man.k && ST.man.k[key]; if (!k) return false;                            // unbekannt: der folgende Untertitel nimmt den Ort (Wendigo-Stimmen)
  const ids = Array.isArray(k) ? k : [k]; st_spiele(ids, '', q, key); return true; }

// ---------------------------------------------------------------- Einbindung
subtitle = (o => function (t, ms, who) { const r = o.apply(this, arguments); try { stimmen_zeile(t, who); } catch (e) {} return r; })(subtitle);
// say(): wartet, bis die Stimme ausgesprochen hat (Lesezeit bleibt Mindestdauer); lädt die Zeilen des Blocks vor
say = async function (lines) { try { if (ST.man && st_an()) for (const l of lines) { const ids = st_finde(l[0], l[2]); if (ids) ids.forEach(st_lade); } } catch (e) {}
  for (const l of lines) { const [t, ms, who] = l, d0 = Math.max(ms, readMs(trX(t))), v = who === 'LUKE' ? 0 : stimmen_dauer(t, who), d = v ? Math.max(d0, v * 1000 + 350) : d0; subtitle(t, d + 250, who); await wait(d); } };
function st_einstellung() { try { const P = document.getElementById('subPanel'), z = P && P.querySelector(':scope > div.close'); if (!z || !P.querySelector('#sGfx') || document.getElementById('sStA')) return;
  z.insertAdjacentHTML('beforebegin', `<div class="row"><span>Sprachausgabe</span><input type="checkbox" id="sStA" ${st_an() ? 'checked' : ''}></div><div class="row"><span>Lautstärke Sprache</span><input type="range" min="0" max="1.5" step="0.05" value="${st_vol()}" id="sStV"></div>`);
  const a = document.getElementById('sStA'), v = document.getElementById('sStV'); a.onclick = v.onclick = ev => ev.stopPropagation();
  a.onchange = ev => { settings.stimmen = ev.target.checked; if (!settings.stimmen) st_stop(.3); saveSettings(); };
  v.oninput = ev => { settings.stimmenVol = +ev.target.value; saveSettings(); if (typeof rangeFill === 'function') rangeFill(v); }; if (typeof rangeFill === 'function') rangeFill(v); } catch (e) {} }

WORLD_MODS.push(['Stimmen', async () => {
  try { if (settings.stimmen === undefined) settings.stimmen = true; if (settings.stimmenVol === undefined) settings.stimmenVol = 1; } catch (e) {}
  const mS = document.getElementById('mSet'); if (mS) mS.addEventListener('click', () => setTimeout(st_einstellung, 0));
  // LWO-Gespräche warten wie say() auf das Ende der Stimme
  if (typeof lwo_ms === 'function') lwo_ms = (o => (text, ms) => { const d = o(text, ms), v = stimmen_dauer(text, ''); return v ? Math.max(d, v * 1000 + 300) : d; })(lwo_ms);
  st_ladeManifest();
  window.__stimmen = { S: ST, finde: st_finde, spiele: (t, who, pos) => st_spiele(st_finde(t, who), who || '', pos || null), dauer: stimmen_dauer, init: () => Audio.init(),
    sub: (t, ms, who) => subtitle(t, ms, who), kino: (t, who, ms) => typeof kino_sag === 'function' && kino_sag(t, who, ms),
    zustand: () => ({ man: ST.man ? Object.keys(ST.man.z).length : 0, cur: ST.cur.map(h => h.id), art: ST.art, env: +ST.env.toFixed(3), ctx: Audio.ctx && Audio.ctx.state, fehl: ST.fehl, an: st_an() }) };
}]);
WORLD_TICK.push(() => { // Hüllkurve für Mundbewegung (nur solange gesprochen wird)
  if (!ST.cur.length) { if (ST.env) { ST.env = 0; if (typeof figuren_mund === 'function') try { figuren_mund(ST.stimme, 0); } catch (e) {} } return; }
  const a = ST.ana, d = ST.tmp; a.getFloatTimeDomainData(d); let s = 0; for (let i = 0; i < d.length; i++) s += d[i] * d[i];
  const r = Math.min(1, Math.sqrt(s / d.length) * 6); ST.env += (r - ST.env) * (r > ST.env ? .6 : .25);
  if (typeof figuren_mund === 'function') try { figuren_mund(ST.stimme, ST.env); } catch (e) {} });
