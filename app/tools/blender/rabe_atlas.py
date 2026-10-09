# Rabe, Atlas: gebackener Körper (unten ¾) + Federkarten/Schuppen/Auge (oberes ¼) → Farbe (RGBA, Alpha = Federumriss), Normalen, ORM.
# Farbe: Der Museumsscan ist ausgeblichen (grau-braun, gestaubt) → auf tiefes Schwarz mit kühlem Stich gebracht, Muster bleibt erhalten.
#   python rabe_atlas.py <werk> <whiskey|kraehe> <px> <federn_ordner> <federn_name>
import sys, json, numpy as np
from PIL import Image, ImageDraw
W, V, PX, FD, FN = sys.argv[1].rstrip('/\\') + '/', sys.argv[2], int(sys.argv[3]), sys.argv[4].rstrip('/\\') + '/', sys.argv[5]
col = np.array(Image.open(W + V + '_farbe.png').convert('RGB')).astype(np.float32) / 255
nrm = np.array(Image.open(W + V + '_normal.png').convert('RGB')).astype(np.float32) / 255
leer = nrm.sum(-1) < .05; nrm[leer] = (.5, .5, 1)  # ungebackene Fläche: flache Normale
# Schnabel-Maske aus den UV-Dreiecken
reg = json.load(open(W + V + '_bereiche.json')); mk = Image.new('L', (PX, PX), 0); d = ImageDraw.Draw(mk)
for uvs, r in reg:
  if r: d.polygon([(u * PX, (1 - v) * PX) for u, v in uvs], fill=255)
beak = np.array(mk).astype(np.float32)[..., None] / 255
# Farbe: Helligkeit stauchen (Gefieder fast schwarz), Muster behalten, Sättigung weg, kühler Stich
lum = col.mean(-1, keepdims=True); sat = col - lum
L = np.clip(lum, 0, 1) ** 1.3 * .30 + .005
out = L + sat * .35
out = out * np.array([.95, .98, 1.07], np.float32)
outB = (np.clip(lum, 0, 1) ** 1.1 * .42 + .01) * np.array([.98, .98, 1.02], np.float32) + sat * .2  # Schnabel: schwarzgrau, Hornstruktur sichtbar
out = out * (1 - beak) + outB * beak
rough = .72 * (1 - beak[..., 0]) + .4 * beak[..., 0]
rgba = np.concatenate([np.clip(out, 0, 1), np.ones(out.shape[:2] + (1,), np.float32)], -1)
orm = np.stack([np.ones(rough.shape), rough, np.zeros(rough.shape)], -1)
# Streifen oben (¼)
fc = np.array(Image.open(FD + f'federn_{FN}_farbe.png').convert('RGBA')).astype(np.float32) / 255
fn = np.array(Image.open(FD + f'federn_{FN}_normal.png').convert('RGB')).astype(np.float32) / 255
fo = np.array(Image.open(FD + f'federn_{FN}_orm.png').convert('RGB')).astype(np.float32) / 255
h = PX // 4; assert fc.shape[1] == PX and fc.shape[0] == h, (fc.shape, PX)
rgba[:h] = fc; nrm[:h] = fn; orm[:h] = fo
Image.fromarray((rgba * 255 + .5).astype(np.uint8), 'RGBA').save(W + f'atlas_{V}_farbe.png')
Image.fromarray((nrm * 255 + .5).astype(np.uint8), 'RGB').save(W + f'atlas_{V}_normal.png')
# Alpha des ORM = Glanzstärke (KHR_materials_specular liest .a): Körper voll, Federkarten gedämpft (die flachen Karten spiegeln sonst wie Platten), Schuppen/Auge voll
spec = np.ones(orm.shape[:2], np.float32); spec[:h] = .55; spec[3 * h // 4:h, int(PX * (3 * (1 - 1 / 16) / 4)):] = 1.
orm4 = np.concatenate([np.clip(orm, 0, 1), spec[..., None]], -1)
Image.fromarray((orm4 * 255 + .5).astype(np.uint8), 'RGBA').save(W + f'atlas_{V}_orm.png')
print('ATLAS', V, PX, 'Schnabelanteil', round(float(beak.mean()), 4))
