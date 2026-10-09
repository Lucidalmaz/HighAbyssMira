# Federkarten für den Raben (Whiskey) und die Krähen: Alpha, Farbe, Normalen, Rauheit – rein rechnerisch, keine Fotos.
# Aufbau einer Feder: Kiel (Calamus) → Schaft (Rachis) → Fahnen aus schräg zur Spitze laufenden Ästen (Barbs), am Grund
# Daunen (grau, locker), Fahnenrand mit kleinen Spalten (Äste reißen auseinander), Handschwingen mit schmaler Außenfahne und
# Einkerbung der Innenfahne (die „Finger“ des Kolkraben). Die Fahne ist leicht gewölbt (Normalen kippen zum Rand).
# Ausgabe: Streifen der Atlas-Textur (oberes Viertel), Zeilen: Handschwinge · Armschwinge · Steuerfeder · 4 Deckfedern + Auge.
#   python rabe_federn.py <ausgabe_ordner> [breite=2048]
import sys, os, numpy as np
from PIL import Image

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
WD = int(sys.argv[2]) if len(sys.argv) > 2 else 2048
RNG = np.random.default_rng(7)

def noise1(n, oct=4, seed=0):  # 1D-Wertrauschen 0..1
  r = np.random.default_rng(seed); out = np.zeros(n)
  for o in range(oct):
    k = 2 ** (o + 3); v = r.random(k + 2); x = np.linspace(0, k, n); i = x.astype(int); f = x - i; f = f * f * (3 - 2 * f)
    out += (v[i] * (1 - f) + v[i + 1] * f) / 2 ** o
  return out / sum(1 / 2 ** o for o in range(oct))

def feder(L, Hh, art, seed):
  """L × Hh Pixel (Länge entlang x, Breite entlang y). art: hand|arm|schwanz|deck. → rgba, normal, rough, ao"""
  s = np.linspace(0, 1, L)[None, :].repeat(Hh, 0)            # Grund → Spitze
  t = np.linspace(-1, 1, Hh)[:, None].repeat(L, 1)            # quer, -1 = Außenfahne
  ns = noise1(L, 5, seed)[None, :]
  # Umriss: halbe Breite je Seite (in Einheiten von t)
  if art == 'hand':
    base = np.clip((s - .05) / .12, 0, 1) ** .7
    tip = np.clip((1 - s) / .26, 0, 1) ** .55
    inner = .92 * base * tip * (1 - .42 * np.exp(-((s - .62) / .07) ** 2))  # Einkerbung (Emargination)
    inner = np.minimum(inner, .92 * base * np.clip((1 - s) / .5, 0, 1) ** .5 + .0)
    outer = .34 * base * np.clip((1 - s) / .2, 0, 1) ** .6
  elif art == 'arm':
    base = np.clip((s - .05) / .1, 0, 1) ** .6
    tip = np.clip((1 - s) / .12, 0, 1) ** .45
    inner = .95 * base * tip; outer = .62 * base * tip
  elif art == 'schwanz':
    base = np.clip((s - .04) / .1, 0, 1) ** .6
    tip = np.clip((1 - s) / .16, 0, 1) ** .5
    inner = .9 * base * tip; outer = .74 * base * tip
  else:  # Deckfeder: kurz, oval, weich
    base = np.clip((s - .03) / .2, 0, 1) ** .5
    tip = np.clip((1 - s) / .35, 0, 1) ** .6
    inner = .95 * base * tip; outer = .9 * base * tip
  half = np.where(t >= 0, inner, outer)
  rel = np.abs(t) / np.maximum(half, 1e-4)                      # 0 am Schaft, 1 am Rand
  # Äste: Linien schräg zur Spitze (Winkel ~ 25–35° zum Schaft); Abstand ~ 3 px
  ang = .55 if art != 'deck' else .8
  d = s * L - np.abs(t) * Hh / 2 / np.tan(ang)
  bar = d / 2.6 + noise1(L, 3, seed + 5)[None, :] * 3
  barb = .5 + .5 * np.sin(bar * 2 * np.pi)
  # Spalten in der Fahne: entlang der Äste, zufällig
  gaps = np.zeros_like(s)
  for g in range(int(L / 90) + (3 if art != 'deck' else 1)):
    side = 1 if RNG.random() < .6 else -1; s0 = RNG.uniform(.25, .95); dw = RNG.uniform(1.5, 4)
    dd = (d - s0 * L) ; m = (np.abs(dd) < dw) & (np.sign(t) == side) & (rel > RNG.uniform(.25, .7))
    gaps[m] = 1
  edge = 1 - rel + (ns - .5) * .08 + (barb - .5) * .05
  alpha = np.clip(edge * 9, 0, 1) * (1 - gaps)
  # Federrand: zur Spitze und zum Rand hin reißen die Äste auseinander (Fahnenrand aufgelöst, Alpha)
  fray = np.clip((s - .8) / .2, 0, 1) * np.clip((rel - .35) / .65, 0, 1) * (barb > .55)
  alpha = alpha * (1 - .85 * fray) * (1 - .5 * np.clip((rel - .85) / .15, 0, 1) * (barb > .4))
  # Kiel/Schaft
  shaftW = (.045 if art != 'deck' else .035) * (1 - .6 * s) + .006
  shaft = np.clip(1 - np.abs(t) / shaftW, 0, 1)
  calamus = (s < .08) & (np.abs(t) < shaftW * 1.4)
  alpha = np.maximum(alpha, (shaft > 0) * (s < .985) * 1.0); alpha[calamus] = 1
  # Daunen am Grund (locker, grau, durchscheinend)
  down = np.clip((.2 - s) / .15, 0, 1) * (art != 'deck') + np.clip((.35 - s) / .3, 0, 1) * (art == 'deck')
  fluff = RNG.random(s.shape) ** 2
  alpha = np.where(down > 0, np.maximum(alpha * (1 - down * .7), (fluff > .55) * (rel < 1.15) * down), alpha)
  # Farbe (sRGB 0..1): fast schwarz, Äste minimal heller, Schaft am Grund grau, Daunen grau
  fed = .8 + .4 * np.random.default_rng(seed).random()                          # jede Feder etwas anders dunkel
  lum = (.046 + .022 * barb + .012 * (ns - .5) - .014 * rel) * fed * (1 - .25 * np.clip((s - .5) / .5, 0, 1) * rel)  # Äste klarer abgesetzt, Fahnenrand dunkler
  lum = lum + shaft * (.05 * (1 - s) + .012) + down * .07
  lum = np.clip(lum, .02, .3)
  rgb = np.stack([lum * .86, lum * .9, lum * 1.2], -1)  # blau-violetter Schiller im Schwarz
  # Normalen: Wölbung zum Rand, Äste als Rillen, Schaft als Grat
  hgt = .6 * (1 - rel ** 2).clip(0) + .07 * barb + .8 * shaft
  gy, gx = np.gradient(hgt)
  nx_ = -gx * 1.3; ny_ = gy * 1.3; nz_ = np.ones_like(nx_)  # Äste nur als feine Rillen (zu stark = graues Glitzern)
  nl = np.sqrt(nx_ ** 2 + ny_ ** 2 + nz_ ** 2); nrm = np.stack([nx_ / nl, ny_ / nl, nz_ / nl], -1)
  rough = np.clip(.84 - .05 * barb - .08 * shaft + .1 * down, .6, .95)
  ao = np.clip(.75 + .25 * (1 - rel) - .3 * down, .3, 1)
  return np.concatenate([rgb, alpha[..., None]], -1), nrm, rough, ao

def auge(n, hell):
  """Auge: Iris (dunkelbraun bzw. milchig für Whiskey), Pupille, feuchter Glanz kommt aus der Rauheit (0,04)."""
  y, x = np.mgrid[-1:1:n * 1j, -1:1:n * 1j]; r = np.sqrt(x * x + y * y); a = np.arctan2(y, x)
  fib = .5 + .5 * np.sin(a * 60 + noise1(n, 3, 3)[None, :] * 8)
  if hell: iris = np.stack([.44 + .06 * fib, .46 + .06 * fib, .49 + .07 * fib], -1) * (1 - .35 * np.clip((r - .55) / .35, 0, 1))[..., None]; pup = .09  # Whiskey: milchig-graues Auge (Story: „fast weiß“), nicht kreideweiß
  else: iris = np.stack([.09 + .03 * fib, .055 + .02 * fib, .035 + .012 * fib], -1); pup = .015
  rgb = np.where((r < .32)[..., None], pup, iris)
  rgb = np.where((r > .86)[..., None], .025, rgb)
  if hell: rgb = rgb * (1 - .25 * np.clip((r - .5) / .4, 0, 1))[..., None]
  nrm = np.zeros(r.shape + (3,)); nrm[..., 2] = 1
  return np.concatenate([np.clip(rgb, 0, 1), np.ones(r.shape + (1,))], -1), nrm, np.full(r.shape, .04), np.ones(r.shape)

def schuppen(L, Hh):
  """Lauf und Zehen: vorn quer liegende Hornschilde (Scuta), hinten feine Netzschuppen, am Ende (u > 0,86) Kralle: schwarz, glatt, glänzend.
  u = Länge, v = Umfang (0,5 = vorn)."""
  u = np.linspace(0, 1, L)[None, :].repeat(Hh, 0); v = np.linspace(0, 1, Hh)[:, None].repeat(L, 1)
  front = np.clip(1 - np.abs(v - .5) / .27, 0, 1) ** .5
  ph = u * 15 + .25 * np.sin(v * 6.283 * 2); plate = np.abs(((ph % 1) - .5) * 2)          # 1 an den Fugen
  groove = np.clip((plate - .82) / .18, 0, 1)
  hx = u * L / 7; hy = v * Hh / 6; cell = np.abs(np.sin(hx * 3.14 + np.sin(hy * 2.1))) * np.abs(np.sin(hy * 3.14 + np.cos(hx * 1.7)))
  net = np.clip((.25 - cell) / .25, 0, 1)
  rill = front * groove + (1 - front) * net
  claw = np.clip((u - .86) / .03, 0, 1)
  lum = (.085 - .04 * rill + .01 * np.sin(u * 40)) * (1 - claw) + .03 * claw
  rgb = np.stack([lum, lum * .99, lum * 1.03], -1)
  hgt = (1 - rill) * .8 * (1 - claw) + claw * .9
  gy, gx = np.gradient(hgt); nx_, ny_ = -gx * 3, gy * 3; nz_ = np.ones_like(nx_); nl = np.sqrt(nx_ ** 2 + ny_ ** 2 + 1)
  nrm = np.stack([nx_ / nl, ny_ / nl, nz_ / nl], -1)
  rough = (.5 + .15 * rill) * (1 - claw) + .28 * claw
  ao = 1 - .35 * rill * (1 - claw)
  return np.concatenate([rgb, np.ones(u.shape + (1,))], -1), nrm, rough, ao

def streifen(WD, hell_auge):
  H = WD // 4; row = H // 4
  rgba = np.zeros((H, WD, 4)); rgba[..., :3] = .04; nrm = np.zeros((H, WD, 3)); nrm[..., 2] = 1; rgh = np.full((H, WD), .5); ao = np.ones((H, WD))
  def put(y0, x0, im):
    a, n, r, o = im; h, w = r.shape; rgba[y0:y0 + h, x0:x0 + w] = a; nrm[y0:y0 + h, x0:x0 + w] = n; rgh[y0:y0 + h, x0:x0 + w] = r; ao[y0:y0 + h, x0:x0 + w] = o
  put(0, 0, feder(WD, row, 'hand', 11))
  put(row, 0, feder(WD, row, 'arm', 12))
  put(2 * row, 0, feder(WD, row, 'schwanz', 13))
  cw = (WD - row) // 4
  for i in range(3): put(3 * row, i * cw, feder(cw, row, 'deck', 20 + i))
  put(3 * row, 3 * cw, schuppen(cw, row))
  put(3 * row, WD - row, auge(row, hell_auge))
  return rgba, nrm, rgh, ao

if __name__ == '__main__':
  os.makedirs(OUT, exist_ok=True)
  for name, hell in (('rabe', True), ('kraehe', False)):
    rgba, nrm, rgh, ao = streifen(WD, hell)
    Image.fromarray((np.clip(rgba, 0, 1) * 255).astype(np.uint8), 'RGBA').save(os.path.join(OUT, f'federn_{name}_farbe.png'))
    Image.fromarray(((nrm * .5 + .5) * 255).astype(np.uint8), 'RGB').save(os.path.join(OUT, f'federn_{name}_normal.png'))
    orm = np.stack([ao, rgh, np.zeros_like(ao)], -1)
    Image.fromarray((orm * 255).astype(np.uint8), 'RGB').save(os.path.join(OUT, f'federn_{name}_orm.png'))
    print('FEDERN', name, rgba.shape)
