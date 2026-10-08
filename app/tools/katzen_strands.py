# Haarkarten-Atlas für die Katzen: feine, spitz zulaufende Haare in Locken (Clumping), Wurzel oben, Spitzen laufen aus (Alpha), leichte Welle/Knick.
#   python tools/katzen_strands.py <ausgabe.png>     (Voraussetzung: numpy, Pillow)
# Aufteilung (UV wie in tools/katzen_fell.mjs): kurzes Fell  x 0–512 · y 0–512   |   langes Fell  x 512–1024 · y 0–1024 (je 1024²-Atlas)
# Farbe = Helligkeit (grau, zur Wurzel dunkler: Tiefenschatten), die Fellfarbe kommt im Shader (katzen.js, katzen_hairMat).
import sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
SS = 3  # Überabtastung
W = 1024
rng = random.Random(7)
img = Image.new('RGBA', (W * SS, W * SS), (0, 0, 0, 0))
# Alpha und Helligkeit getrennt zeichnen (Alpha: Haarkern, Helligkeit: Wurzel dunkel → Spitze hell)
A = Image.new('L', img.size, 0); Lm = Image.new('L', img.size, 0)
dA = ImageDraw.Draw(A); dL = ImageDraw.Draw(Lm)

def strand(x0, y0, length, th, wave, wave_f, drift, clump_dx, lum0, lum1, dA=dA, dL=dL, steps=28):
  pts = []
  for i in range(steps + 1):
    t = i / steps
    x = x0 + clump_dx * t * t + drift * t + wave * math.sin(t * wave_f * math.pi * 2) * t
    y = y0 + length * t
    pts.append((x, y))
  for i in range(steps):
    t = i / steps
    w = th * (1 - .86 * t ** 1.4)
    a = int(255 * min(1, (1 - t) * 3.2))  # Spitze läuft aus
    l = int(255 * (lum0 + (lum1 - lum0) * t))
    p0, p1 = pts[i], pts[i + 1]
    # als schmale Linie mit Breite w (in Atlas-Pixeln * SS)
    dA.line([p0, p1], fill=a, width=max(1, int(w * SS)))
    dL.line([p0, p1], fill=l, width=max(1, int(w * SS)))

def block(x0, y0, bw, bh, n_clumps, per_clump, lmin, lmax, th, wave, wave_f, spread, lum_mean):
  for c in range(n_clumps):
    cx = x0 + rng.uniform(.04, .96) * bw; cdrift = rng.uniform(-.04, .04); cl = rng.uniform(lmin, lmax)
    for s in range(per_clump):
      x = cx + rng.gauss(0, spread * bw); L = cl * rng.uniform(.82, 1.08); y = y0 + rng.uniform(-.004, .012) * bh
      lm = lum_mean * rng.uniform(.82, 1.18)
      strand(x * SS, y * SS, L * bh * SS, th * rng.uniform(.8, 1.25), wave * rng.uniform(.5, 1.4) * bw * SS, wave_f * rng.uniform(.8, 1.5), (cdrift + rng.gauss(0, .006)) * bw * SS, rng.gauss(0, .012) * bw * SS, lm * .55, lm * 1.15)
  # dichter Wurzelstreifen (keine Lücken an der Haut): schmales, oben fast geschlossenes Band
  for i in range(int(bw * 1.2)):
    x = x0 + rng.uniform(0, bw); strand(x * SS, y0 * SS, rng.uniform(.05, .12) * bh * SS, th * 1.2, 0, 1, 0, 0, lum_mean * .4, lum_mean * .6)

# kurzes Fell: Tile 512 × 512
block(0, 0, 512, 512, 46, 5, .78, .98, 2.6, .006, 1.3, .02, .55)
# langes Fell: Tile 512 × 1024 (längere, wellige Locken)
block(512, 0, 512, 1024, 38, 5, .72, .97, 3.1, .016, 1.1, .02, .55)
a = np.array(A.resize((W, W), Image.LANCZOS)).astype(np.float32); l = np.array(Lm.resize((W, W), Image.LANCZOS)).astype(np.float32)
# Helligkeit dort, wo Haar ist (Division durch Alpha wegen Mittelung)
al = np.clip(a / 255., 0, 1); lum = np.where(al > .02, np.clip(l / np.maximum(a, 1) , 0, 1), .0) if False else np.clip(l / np.maximum(a / 255., .02) / 255., 0, 1)
lum = np.clip(lum, 0, 1)
rgb = np.stack([lum, lum, lum], -1)
out = np.dstack([(rgb * 255).astype(np.uint8), a.astype(np.uint8)])
im = Image.fromarray(out, 'RGBA'); im.save(sys.argv[1] if len(sys.argv) > 1 else 'strands.png')
print('Alpha-Abdeckung kurz:', (a[:512, :512] > 90).mean().round(3), 'lang:', (a[:, 512:] > 90).mean().round(3))
