"""Erzeugt die PBR-Texturen für Birkenhain (Farbe, Normalmap, Rauheit) als PNG.
Aufruf: python gen_textures.py   → schreibt nach Scripts/tex/
"""
import os, numpy as np
from PIL import Image, ImageFilter

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tex')
os.makedirs(OUT, exist_ok=True)
N = 2048
rng = np.random.default_rng(7)


def fbm(n=N, octaves=6, base=4, persist=.5, seed=0):
    """Kachelbares Fraktalrauschen 0..1."""
    r = np.random.default_rng(seed); out = np.zeros((n, n), np.float32); amp = 1.; tot = 0.
    for o in range(octaves):
        f = base * 2 ** o
        g = r.random((f, f)).astype(np.float32)
        img = Image.fromarray((g * 255).astype(np.uint8)).resize((n, n), Image.BICUBIC)
        # kachelbar machen: Wiederholung vor dem Skalieren
        g3 = np.tile(g, (3, 3)); big = Image.fromarray((g3 * 255).astype(np.uint8)).resize((n * 3, n * 3), Image.BICUBIC)
        a = np.asarray(big, np.float32)[n:2 * n, n:2 * n] / 255.
        out += a * amp; tot += amp; amp *= persist
    return out / tot


def blur(a, r): return np.asarray(Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), np.float32) / 255.


def normal_from_height(h, strength):
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * strength
    gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * strength
    n = np.dstack([-gx, gy, np.ones_like(h)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    return ((n * .5 + .5) * 255).astype(np.uint8)


def save(name, color, height, rough, nstr):
    Image.fromarray(np.clip(color * 255, 0, 255).astype(np.uint8)).save(os.path.join(OUT, f'T_{name}_D.png'))
    Image.fromarray(normal_from_height(height, nstr)).save(os.path.join(OUT, f'T_{name}_N.png'))
    Image.fromarray(np.clip(rough * 255, 0, 255).astype(np.uint8)).save(os.path.join(OUT, f'T_{name}_R.png'))
    print('  ', name)


def rgb(c, a): return np.dstack([a * c[0], a * c[1], a * c[2]])


def cracks(n=N, count=14, seed=1, width=2):
    from PIL import ImageDraw
    img = Image.new('L', (n, n), 0); d = ImageDraw.Draw(img); r = np.random.default_rng(seed)
    for _ in range(count):
        x, y = r.random() * n, r.random() * n; pts = [(x, y)]
        for _ in range(int(r.integers(8, 20))):
            x += r.normal(0, 40); y += r.normal(0, 40); pts.append((x, y))
        d.line(pts, fill=255, width=width)
    return np.asarray(img.filter(ImageFilter.GaussianBlur(1)), np.float32) / 255.


print('Texturen werden erzeugt ...')
# Asphalt, nass, mit Pfützen
agg = rng.random((N, N)).astype(np.float32); agg = (agg > .82) * rng.random((N, N)).astype(np.float32)
large = fbm(seed=2, base=3); puddle = np.clip((fbm(seed=3, base=2, octaves=4) - .56) * 9, 0, 1); puddle = blur(puddle, 6)
cr = cracks(seed=4)
h = .5 + agg * .35 + (large - .5) * .3 - cr * .6; h = h * (1 - puddle) + .45 * puddle
base = .11 + agg * .12 + (large - .5) * .06 - cr * .08; base = base * (1 - puddle * .45)
save('Asphalt', rgb((1, 1, 1.05), base), blur(h, 1), np.clip(.72 + (large - .5) * .2 - puddle * .68 - agg * .1, .04, 1), 5)

# Gehweg: Betonplatten 1 m (Textur = 3 m)
s = N // 3; seams = np.zeros((N, N), np.float32)
for i in range(4): seams[max(0, i * s - 4):i * s + 4, :] = 1; seams[:, max(0, i * s - 4):i * s + 4] = 1
tile = np.zeros((N, N), np.float32)
for i in range(3):
    for j in range(3): tile[i * s:(i + 1) * s, j * s:(j + 1) * s] = rng.uniform(-.04, .04)
stain = fbm(seed=5); wet = np.clip((fbm(seed=6, base=2) - .55) * 5, 0, 1)
col = .36 + tile + (stain - .5) * .12 - seams * .2 - wet * .1
save('Sidewalk', rgb((1, .98, .94), col), .6 + (stain - .5) * .2 - seams * .5, np.clip(.85 - wet * .5 + (stain - .5) * .1, .1, 1), 6)

# Gras (dunkles Herbstgras, feucht)
blades = rng.random((N, N)).astype(np.float32); blades = np.asarray(Image.fromarray((blades * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.6)).resize((N, N)), np.float32) / 255.
g = fbm(seed=8, base=6); dirt = np.clip((fbm(seed=9, base=3) - .6) * 4, 0, 1)
col = np.dstack([.07 + g * .06 + dirt * .08, .1 + g * .08 + blades * .05 - dirt * .02, .05 + g * .03]); col = col * (1 - dirt[..., None] * .3)
save('Grass', col, blades * .6 + g * .4, np.clip(.9 - dirt * .1, .5, 1), 3)

# Holzverkleidung (Graustufen – wird im Material eingefärbt), 8 Bretter je Kachel
p = N // 8; y = np.arange(N) % p / p
plank = np.tile(y[:, None], (1, N)); streak = fbm(seed=10, base=8)
dirtv = np.clip(np.linspace(0, 1, N)[:, None] ** 3 * 1.2, 0, 1) * np.ones((1, N))
col = .78 + (streak - .5) * .12 - (plank > .96) * .35 - dirtv * .15
save('Siding', rgb((1, 1, 1), col), np.where(plank > .96, .05, plank * .9), .75 + (streak - .5) * .2, 9)

# Dachschindeln
rows = 10; rh = N // rows; tw = N // 6; hh = np.zeros((N, N), np.float32); cc = np.zeros((N, N), np.float32)
for r in range(rows):
    off = (r % 2) * tw // 2
    for c in range(-1, 7):
        x0 = c * tw + off; v = rng.uniform(.06, .14)
        cc[r * rh:(r + 1) * rh, max(0, x0 + 2):min(N, x0 + tw - 2)] = v
        hh[r * rh:(r + 1) * rh, max(0, x0 + 2):min(N, x0 + tw - 2)] = np.linspace(.2, 1, rh)[:, None]
moss = np.clip((fbm(seed=11, base=4) - .62) * 5, 0, 1)
col = np.dstack([cc + moss * .05, cc + moss * .09, cc + moss * .03])
save('Roof', col, hh, np.clip(.8 - moss * .1, .3, 1), 8)

# Ziegel
rows = 18; bh = N // rows; bw = N // 5; hh = np.full((N, N), .2, np.float32); col = np.zeros((N, N, 3), np.float32) + np.array([.42, .4, .37])
for r in range(rows):
    off = (r % 2) * bw // 2
    for c in range(-1, 6):
        x0 = c * bw + off; x1 = x0 + bw
        a, b = max(0, x0 + 6), min(N, x1 - 6)
        if a >= b: continue
        hue = np.array([rng.uniform(.34, .48), rng.uniform(.14, .22), rng.uniform(.1, .15)])
        col[r * bh + 6:(r + 1) * bh - 6, a:b] = hue; hh[r * bh + 6:(r + 1) * bh - 6, a:b] = .85
n2 = fbm(seed=12, base=16)
save('Brick', col * (.85 + n2[..., None] * .3), hh + (n2 - .5) * .15, .85 + (n2 - .5) * .1, 10)

# Holzboden (Innenräume)
p = N // 7; y = np.arange(N) % p; grain = fbm(seed=13, base=2)
grain = np.asarray(Image.fromarray((grain * 255).astype(np.uint8)).resize((N // 16, N)).resize((N, N)), np.float32) / 255.
seam = (y < 5)[:, None] * np.ones((1, N))
col = np.dstack([.2 + grain * .12, .12 + grain * .07, .07 + grain * .04]) * (1 - seam[..., None] * .7)
save('WoodFloor', col, .7 - seam * .6 + grain * .1, .55 + (grain - .5) * .3, 5)

# Rinde
v = fbm(seed=14, base=4)
v = np.asarray(Image.fromarray((v * 255).astype(np.uint8)).resize((N // 12, N)).resize((N, N)), np.float32) / 255.
save('Bark', np.dstack([.09 + v * .06, .07 + v * .05, .06 + v * .04]), v, np.full((N, N), .95, np.float32), 10)
print('fertig:', OUT)
