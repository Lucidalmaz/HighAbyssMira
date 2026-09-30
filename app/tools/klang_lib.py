# Klang-Werkzeuge (nur numpy + soundfile – scipy ist auf diesem Rechner gesperrt): Resampling, FFT-Filter, Lautheit (BS.1770), Schleifen, Sampler, Hall.
import numpy as np, soundfile as sf, os, re, glob, json
SR = 48000
HAM = r'C:\Users\GIGABYTE\HAM_Audio'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'game', 'audio')
RNG = np.random.default_rng(1310)
LOOP_PAD = 12000  # 0,25 s Rand an Schleifen (siehe loopify)
def db(v): return 10 ** (v / 20)
def st(x):  # immer (n, 2)
    x = np.asarray(x, np.float32)
    if x.ndim == 1: return np.stack([x, x], 1)
    if x.shape[1] == 1: return np.repeat(x, 2, 1)
    if x.shape[1] == 4: w, y = x[:, 0], x[:, 1]; return np.stack([w + .7 * y, w - .7 * y], 1)  # AmbiX (W, Y, Z, X) -> Stereo (M/S)
    return x[:, :2]
def mono(x): x = np.asarray(x, np.float32); return x if x.ndim == 1 else x.mean(1)
def resample(x, sr, to=SR):
    if sr == to: return np.asarray(x, np.float32)
    n = len(x); m = int(round(n * to / sr)); X = np.fft.rfft(x, axis=0); k = m // 2 + 1
    Y = np.zeros((k,) + X.shape[1:], X.dtype); c = min(k, len(X)); Y[:c] = X[:c]
    return (np.fft.irfft(Y, n=m, axis=0) * (m / n)).astype(np.float32)
def ffilt(x, H):  # Nullphasen-Filter über die ganze Länge; H(f) -> Betrag
    n = len(x); N = 1 << int(np.ceil(np.log2(n + 4096))); pad = np.zeros((N,) + x.shape[1:], np.float32); pad[:n] = x
    f = np.fft.rfftfreq(N, 1 / SR); f[0] = 1e-3; X = np.fft.rfft(pad, axis=0); h = H(f); X *= h[:, None] if x.ndim == 2 else h
    return np.fft.irfft(X, n=N, axis=0)[:n].astype(np.float32)
def HP(f0, o=2): return lambda f: 1 / np.sqrt(1 + (f0 / f) ** (2 * o))
def LP(f0, o=2): return lambda f: 1 / np.sqrt(1 + (f / f0) ** (2 * o))
def HSH(f0, g): return lambda f: 1 + (db(g) - 1) * (f ** 2 / (f ** 2 + f0 ** 2))  # Höhen-Kuhschwanz
def LSH(f0, g): return lambda f: 1 + (db(g) - 1) * (f0 ** 2 / (f ** 2 + f0 ** 2))
def chain(*hs): return lambda f: np.prod([h(f) for h in hs], 0)
def _biq(b, a, f):
    w = 2 * np.pi * f / SR; z = np.exp(-1j * w); return np.abs((b[0] + b[1] * z + b[2] * z * z) / (a[0] + a[1] * z + a[2] * z * z))
def kweight(f): return _biq([1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, .73248077421585], f) * _biq([1, -2, 1], [1, -1.99004745483398, .99007225036621], f)
def lufs(x):
    x = st(x); y = ffilt(x, kweight); B = int(.4 * SR); H = B // 4
    if len(y) < B: y = np.concatenate([y, np.zeros((B - len(y), 2), np.float32)])
    ms = np.array([np.mean(y[i:i + B] ** 2, 0).sum() for i in range(0, len(y) - B + 1, H)])
    L = -.691 + 10 * np.log10(ms + 1e-12); g = ms[L > -70]
    if not len(g): return -99.0
    rel = -.691 + 10 * np.log10(g.mean()) - 10; g2 = ms[(L > -70) & (L > rel)]
    return float(-.691 + 10 * np.log10(g2.mean()))
def peak(x): return float(20 * np.log10(np.abs(x).max() + 1e-9))
def norm(x, target=-23, pk=-1.0):
    l = lufs(x); x = x * db(target - l); p = np.abs(x).max()
    if p > db(pk): x = softlimit(x, pk)
    return x.astype(np.float32)
def softlimit(x, pk=-1.0):  # sanfter Begrenzer (Hüllkurve mit Rückstellzeit), kein hartes Kappen
    lim = db(pk); a = np.abs(x).max(1) if x.ndim == 2 else np.abs(x); need = np.minimum(1, lim / np.maximum(a, 1e-9))
    rel = int(.08 * SR); g = need.copy()
    for i in range(1, len(g)): g[i] = min(need[i], g[i - 1] + (1 - g[i - 1]) / rel)
    for i in range(len(g) - 2, -1, -1): g[i] = min(g[i], g[i + 1] + (1 - g[i + 1]) / 240)  # kurzer Vorlauf
    return (x * (g[:, None] if x.ndim == 2 else g)).astype(np.float32)
def fade(x, a=.01, r=.05):
    x = x.copy(); na, nr = int(a * SR), int(r * SR)
    if na: x[:na] *= np.linspace(0, 1, na)[:, None] if x.ndim == 2 else np.linspace(0, 1, na)
    if nr: x[-nr:] *= np.linspace(1, 0, nr)[:, None] ** 2 if x.ndim == 2 else np.linspace(1, 0, nr) ** 2
    return x
def loopify(x, xf=3.0):  # nahtlose Schleife: Ende gleichleistungs-überblendet in den Anfang
    n = int(xf * SR); t = np.linspace(0, np.pi / 2, n)[:, None]; y = x[:len(x) - n].copy()
    y[:n] = x[:n] * np.sin(t) + x[len(x) - n:] * np.cos(t)
    return np.concatenate([y[-LOOP_PAD:], y, y[:LOOP_PAD]])  # Rand je 0,25 s: Opus verfälscht die ersten/letzten Millisekunden – das Spiel schneidet ihn ab
manifest = {}
def save(name, x, q=.9, loud=None):
    os.makedirs(OUT, exist_ok=True); x = np.clip(np.asarray(x, np.float32), -1, 1)
    path = os.path.join(OUT, name + '.ogg'); sf.write(path, x, SR, format='OGG', subtype='OPUS', compression_level=q)
    manifest[name] = {'s': round(len(x) / SR, 2), 'lufs': round(lufs(x), 1), 'pk': round(peak(x), 1), 'kb': round(os.path.getsize(path) / 1024)}
    print(f'  {name:22s} {manifest[name]}')
def src(key):  # Ausschnitt aus den Sonniss-Bündeln (quellen.py) -> 48 kHz
    x = np.load(os.path.join(HAM, 'src', key + '.npy')); sr = int(open(os.path.join(HAM, 'src', key + '.txt'), encoding='utf-8').readline())
    return resample(x.astype(np.float32), sr)
def segments(x, n=6, thr=-30, minl=.08, maxl=3.0, gap=.12, pre=.01, post=.25):
    m = mono(x); w = int(.01 * SR); e = np.sqrt(np.convolve(m ** 2, np.ones(w) / w, 'same')) + 1e-9; e = 20 * np.log10(e / e.max())
    on = e > thr; segs = []; i = 0; L = len(on)
    while i < L:
        if on[i]:
            j = i
            while j < L and (on[j] or (j + int(gap * SR) < L and on[j:j + int(gap * SR)].any())): j += 1
            if (j - i) / SR >= minl: segs.append((max(0, i - int(pre * SR)), min(L, j + int(post * SR))))
            i = j
        else: i += 1
    segs = [(a, min(b, a + int(maxl * SR))) for a, b in segs]
    segs.sort(key=lambda s: -np.sum(m[s[0]:s[1]] ** 2)); segs = sorted(segs[:n])
    return [fade(x[a:b], .004, min(.15, (b - a) / SR * .3)) for a, b in segs]
# ---------------------------------------------------------------- Sampler (VSCO 2 CE, CC0)
NOTE = {'C': -9, 'D': -7, 'E': -5, 'F': -4, 'G': -2, 'A': 0, 'B': 2, 'H': 2}
def N(n):
    m = re.match(r'([A-H])(#|b)?(-?\d)', n); i = NOTE[m[1]] + (1 if m[2] == '#' else -1 if m[2] == 'b' else 0)
    return 440 * 2 ** ((i + (int(m[3]) - 4) * 12) / 12)
def f0_detect(x, lo=25, hi=4200):  # YIN auf 120 ms im Halteteil
    m = mono(x); a = int(.35 * SR); w = int(.12 * SR); seg = m[a:a + 2 * w] if len(m) > a + 2 * w else m[:2 * w]
    if len(seg) < 2 * w: return None
    b = seg[:w]; d = np.array([np.sum((b - seg[t:t + w]) ** 2) for t in range(w)])
    d[0] = 1; cm = d[1:] * np.arange(1, w) / np.maximum(np.cumsum(d[1:]), 1e-12); cm = np.concatenate([[1], cm])
    tmin, tmax = int(SR / hi), min(w - 1, int(SR / lo)); c = cm[tmin:tmax]; idx = np.where(c < .15)[0]
    t = (idx[0] + tmin) if len(idx) else (np.argmin(c) + tmin)
    while t + 1 < tmax and cm[t + 1] < cm[t]: t += 1
    return SR / t
class Inst:
    def __init__(self, pattern, name_re, detect=True, gain=1.0):
        self.s = []
        for p in sorted(glob.glob(os.path.join(HAM, 'vsco', pattern))):
            m = re.search(name_re, os.path.basename(p))
            if not m: continue
            x, sr = sf.read(p, dtype='float32'); x = resample(st(x), sr); g = N(m[1]) if not m[1].isdigit() else 440 * 2 ** ((21 + 2 * int(m[1]) - 69) / 12)
            self.s.append([g, x * gain, os.path.basename(p)])
        if detect is True:
            ks = [round(np.log2(d / s[0])) for s in self.s for d in [f0_detect(s[1])] if d]
            k = int(np.median(ks)) if ks else 0; self.oct = k
            for s in self.s: s[0] *= 2 ** k
        elif detect: 
            for s in self.s: s[0] *= 2 ** detect
        self.s.sort(key=lambda s: s[0])
        if not self.s: raise RuntimeError('keine Samples: ' + pattern)
    def note(self, f, dur=None, v=1.0, a=.0, r=.3, off=0.0):
        s = min(self.s, key=lambda s: abs(np.log2(f / s[0]))); ratio = f / s[0]; x = s[1]
        n = len(x) if dur is None else min(len(x), int((dur + r) * SR * ratio) + int(off * SR))
        pos = np.arange(int(off * SR), n, ratio); pos = pos[pos < len(x) - 1]; i = pos.astype(int); fr = (pos - i)[:, None]
        y = x[i] * (1 - fr) + x[i + 1] * fr
        if dur is not None and len(y) > int(dur * SR):
            k = int(dur * SR); nr = min(len(y) - k, int(r * SR)); y = y[:k + nr].copy(); y[k:] *= np.linspace(1, 0, nr)[:, None] ** 2
        if a > 0: na = min(len(y), int(a * SR)); y[:na] *= np.linspace(0, 1, na)[:, None]
        return (y * v).astype(np.float32)
    def long(self, f, dur, v=1.0, a=1.5, r=2.0, xf=1.5):  # lange Töne: gleichleistungs-überblendete Wiederholungen des Haltetons (Samples sind nur 6–13 s lang)
        y = self.note(f); o = int(.7 * SR); n = int((dur + r) * SR); X = int(xf * SR)
        if len(y) >= n: return self.note(f, dur, v, a, r)
        out = np.zeros((n + len(y), 2), np.float32); out[:len(y)] = y; k = len(y); body = y[o:]; t = np.linspace(0, np.pi / 2, X)[:, None]
        while k < n:
            s0 = k - X; out[s0:k] *= np.cos(t); p = body.copy(); p[:X] *= np.sin(t); out[s0:s0 + len(p)] += p; k = s0 + len(p)
        out = out[:n]; na = int(a * SR)
        if na: out[:na] *= np.linspace(0, 1, na)[:, None]
        nr = int(r * SR); out[-nr:] *= np.linspace(1, 0, nr)[:, None] ** 2
        return out * v
class Canvas:
    def __init__(self, dur): self.x = np.zeros((int(dur * SR), 2), np.float32)
    def add(self, y, t, g=1.0, pan=0.0):
        if y.ndim == 1: y = st(y)
        k = int(t * SR); n = min(len(y), len(self.x) - k)
        if n <= 0: return
        pl, pr = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
        self.x[k:k + n, 0] += y[:n, 0] * g * min(1, pl); self.x[k:k + n, 1] += y[:n, 1] * g * min(1, pr)
def ir(sec=3.5, pre=.025, bright=5000, damp=2200, er=True, seed=5):
    r = np.random.default_rng(seed); n = int(sec * SR); t = np.arange(n) / SR
    x = r.standard_normal((n, 2)).astype(np.float32) * np.exp(-6.9 * t / sec)[:, None]
    hi = ffilt(x, LP(damp, 1)); x = hi + (ffilt(x, LP(bright, 2)) - hi) * np.exp(-6.9 * t / (sec * .35))[:, None]  # Höhen klingen schneller ab
    x = np.concatenate([np.zeros((int(pre * SR), 2), np.float32), x])
    if er:
        for d, g in ((.011, .5), (.017, .42), (.023, .35), (.031, .3), (.043, .22)): i = int(d * SR); x[i, 0] += g * (r.random() - .5) * 2; x[i + 37, 1] += g * (r.random() - .5) * 2
    return x / np.sqrt((x ** 2).sum() / 2)
def conv(x, h):
    n = len(x) + len(h) - 1; N = 1 << int(np.ceil(np.log2(n)))
    return np.stack([np.fft.irfft(np.fft.rfft(x[:, c], N) * np.fft.rfft(h[:, c], N), N)[:n] for c in (0, 1)], 1).astype(np.float32)
def reverb(x, sec=3.5, wet=.35, **kw):
    h = ir(sec, **kw); w = conv(x, h)[:len(x) + int(sec * SR)] * .25
    y = np.zeros_like(w); y[:len(x)] = x * (1 - wet * .5); return y + w * wet
