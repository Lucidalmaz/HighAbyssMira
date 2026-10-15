(async () => {
  const W = ms => new Promise(r => setTimeout(r, ms));
  const SM = window.__stimmen; if (!SM) return 'FEHLER: kein __stimmen';
  const ST = SM.S;
  if (window.__vt && window.__vt.v === 6) return 'vt schon';
  // Ton einschalten (Autoplay) – das Spiel selbst tut das beim ersten Klick
  try { if (!Audio.ctx) { await SM.init(); } } catch (e) {}
  const A = (window.__k6 || window.__villa).ev('Audio'); const ctx = A.ctx; if (!ctx) return 'FEHLER: kein AudioContext';
  try { if (ctx.state !== 'running') await ctx.resume(); } catch (e) {}
  // Messabgriff hinter dem Begrenzer = was wirklich ausgegeben wird
  const an = ctx.createAnalyser(); an.fftSize = 4096; an.smoothingTimeConstant = 0; A.lim.connect(an);
  const tb = new Float32Array(an.fftSize), fb = new Float32Array(an.frequencyBinCount);
  const db = v => 20 * Math.log10(Math.max(v, 1e-9));
  const sample = () => { an.getFloatTimeDomainData(tb); let s = 0, p = 0; for (let i = 0; i < tb.length; i++) { s += tb[i] * tb[i]; const a = Math.abs(tb[i]); if (a > p) p = a; } return [Math.sqrt(s / tb.length), p]; };
  const lowband = () => { an.getFloatFrequencyData(fb); const hz = ctx.sampleRate / an.fftSize; let lo = 0, mid = 0, hi = 0; for (let i = 1; i < fb.length; i++) { const f = i * hz, e = Math.pow(10, fb[i] / 10); if (f < 250) lo += e; else if (f < 3400) mid += e; else if (f < 12000) hi += e; } return [lo, mid, hi]; };
  // Zähler: wie oft wird je Aufnahme (Puffer) ein Quellknoten gestartet (Dopplung)
  const starts = window.__vt_s5 || (window.__vt_s5 = []); if (!AudioBufferSourceNode.prototype.__vt5) { const o = AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start = function () { try { if (this.buffer && this.buffer.duration > .2 && this.buffer.duration < 60) window.__vt_s5.push({ d: this.buffer.duration, t: performance.now() }); } catch (e) {} return o.apply(this, arguments); }; AudioBufferSourceNode.prototype.__vt5 = 1; }
  // Untertitel beobachten
  const subEl = () => document.getElementById('subtitle');
  const subVis = () => { const e = subEl(); if (!e) return null; const cs = getComputedStyle(e); return { v: +cs.opacity > .3 && (e.textContent || '').trim().length > 0, tx: (e.textContent || '').trim() }; };
  // Eine Zeile ausloesen und messen
  async function zeile(c, o = {}) {
    const R = { f: c.f, mod: c.mod, id: c.id, who: c.who, dur: c.dur, art_soll: c.art };
    const ids = SM.finde(c.text, c.who);
    R.gefunden = ids ? ids.join(',') : null; R.sprecher = ids ? ST.man.z[ids[0]][2] : null; R.sprecher_ok = R.sprecher === c.f;
    // Ruhe abwarten
    for (let i = 0; i < 60 && ST.cur.length; i++) await W(100);
    await W(200);
    const bed = []; for (let i = 0; i < 6; i++) { bed.push(sample()[0]); await W(60); }
    const n0 = starts.length, t0 = performance.now(), tw = []; let sawSub = null, subFirst = null, subLast = null;
    SM.sub(c.text, o.ms || 1200, c.who);
    let started = null, endT = null, peak = 0; const rms = [], spec = [];
    for (let k = 0; k < (c.dur * 1000 + 3000) / 40; k++) {
      await W(40); const t = performance.now() - t0, sv = subVis(), [r, p] = sample();
      if (ST.cur.length && started === null) started = t;
      if (started !== null) { rms.push(r); if (p > peak) peak = p; if (rms.length % 3 === 0) spec.push(lowband()); }
      if (sv && sv.v) { if (subFirst === null) subFirst = t; subLast = t; }
      if (started !== null && !ST.cur.length && endT === null) endT = t;
      if (endT !== null && (subFirst === null || (sv && !sv.v && t > subLast + 300))) break;
    }
    R.start_ms = started === null ? null : Math.round(started);
    R.stimme_ms = endT !== null && started !== null ? Math.round(endT - started) : null;
    R.sub_ms = subFirst !== null ? Math.round(subLast - subFirst + 40) : null;
    R.art = ST.art ? ST.art.split('@')[0] : null;
    const ds = ids ? ids.map(i => ST.man.z[i][1]) : []; R.starts = starts.slice(n0).filter(s => ds.some(d => Math.abs(d - s.d) < .08)).length; R.soll_starts = ids ? ids.length : 0; R.fremd_starts = starts.length - n0 - R.starts;
    R.peak_dbfs = rms.length ? +db(peak).toFixed(1) : null;
    const top = rms.slice().sort((a, b) => b - a).slice(0, Math.max(1, Math.round(rms.length * .5)));
    R.voice_rms_db = top.length ? +db(top.reduce((s, v) => s + v, 0) / top.length).toFixed(1) : null;
    R.bed_rms_db = +db(bed.reduce((s, v) => s + v, 0) / bed.length).toFixed(1);
    R.snr_db = R.voice_rms_db !== null ? +(R.voice_rms_db - R.bed_rms_db).toFixed(1) : null;
    if (spec.length) { const s = spec.reduce((a, v) => [a[0] + v[0], a[1] + v[1], a[2] + v[2]], [0, 0, 0]); const tot = s[0] + s[1] + s[2] + 1e-30; R.low_pct = +(100 * s[0] / tot).toFixed(1); R.high_pct = +(100 * s[2] / tot).toFixed(1); }
    R.ok = !!(R.sprecher_ok && started !== null && R.starts === R.soll_starts && (R.sub_ms === null || R.stimme_ms === null || R.sub_ms >= R.stimme_ms - 60) && (R.peak_dbfs === null || R.peak_dbfs < -0.3));
    return R;
  }
  window.__vt = { v: 6, zeile, sample, db, W, an, starts, subVis };
  return 'vt bereit ctx=' + ctx.state + ' sr=' + ctx.sampleRate + ' man=' + Object.keys(ST.man.z).length;
})()
