# Echte Sprühfarbe aus den 8k-Fotoscans freistellen (Farbe = Original-Pixel, Alpha = Farbabstand zum Untergrund)
import numpy as np, os
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
Image.MAX_IMAGE_PIXELS = None
D = 'C:/Users/GIGABYTE/HAM_FabDownloads/v20_texturen/'
O = 'C:/Users/GIGABYTE/HAM_FabDownloads/v20_texturen/_cut/'
os.makedirs(O, exist_ok=True)

def ss(x, a, b): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

def cut(src, box, name, mode, scale=.25, rot=0, keep_min=150):
    im = Image.open(D + src).convert('RGB').crop(box)
    if rot: im = im.rotate(rot, expand=True)
    im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255
    # Untergrund: grober Median (Farbe der Wand ohne Farbe)
    small = im.resize((max(8, im.width // 8), max(8, im.height // 8)), Image.BILINEAR)
    bg = np.asarray(small.filter(ImageFilter.MedianFilter(9)).resize(im.size, Image.BILINEAR)).astype(np.float32) / 255
    L = a @ [.299, .587, .114]; Lb = bg @ [.299, .587, .114]
    if mode == 'schwarz':  # Untergrund = helle Seite der Umgebung (Farbe ist dunkler als die Wand)
        sl = np.asarray(Image.fromarray((L * 255).astype(np.uint8)).resize(small.size, Image.BILINEAR)).astype(np.float32) / 255
        Lb = np.asarray(Image.fromarray((ndi.percentile_filter(sl, 80, size=7) * 255).astype(np.uint8)).resize(im.size, Image.BILINEAR)).astype(np.float32) / 255
        m = ss(Lb - L, .12, .34) * (1 - ss(a.max(2) - a.min(2), .22, .4))
    elif mode == 'rot':
        m = ss(a[..., 0] - np.maximum(a[..., 1], a[..., 2]), .10, .30)
    else:  # bunt: Abstand zur Wandfarbe
        m = ss(np.sqrt(((a - bg) ** 2).sum(2)), .12, .30)
    # Poren/Löcher entfernen: nur zusammenhängende größere Farbflächen behalten, weicher Rand bleibt
    core = m > .5
    core = ndi.binary_opening(core, iterations=2)
    lab, n = ndi.label(core); sizes = ndi.sum(core, lab, range(1, n + 1))
    keep = np.isin(lab, 1 + np.nonzero(sizes >= keep_min)[0])
    near = ndi.binary_dilation(keep, iterations=int(10 * scale * 4))
    al = m * near
    rgba = np.dstack([a, al]); Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA').save(O + name + '.png')
    # Vorschau auf grauem Grund
    pv = a * al[..., None] + .55 * (1 - al[..., None]); p = Image.fromarray((pv * 255).astype(np.uint8)); p.thumbnail((700, 700)); p.save(O + 'pv_' + name + '.jpg')
    print(name, im.size, round(float(al.mean()), 3))

R = 'graffiti_rot/textures/RedGraffitiWall.jpg'
cut(R, (2700, 4300, 5500, 6300), 'r_tag_gross', 'schwarz')          # großer schwarzer Tag unten Mitte
cut(R, (6400, 0, 7900, 1700), 'r_tag_oben', 'schwarz')               # schwarzer Tag oben rechts
cut(R, (500, 900, 1800, 2400), 'r_tag_links', 'schwarz')             # schwarzer Tag links
cut(R, (1800, 6500, 3500, 8000), 'r_tag_unten', 'schwarz')           # schwarzer Kringel unten links
cut(R, (1900, 1200, 5300, 5300), 'r_rot', 'rot')                      # rote Sprühspuren
cut(R, (6400, 0, 7900, 1700), 'r_rot_oben', 'rot')
cut('graffiti_apeadero/textures/model1.jpeg', (4700, 1500, 6000, 2450), 'a_elefant', 'bunt', scale=.4)
cut('graffiti_apeadero/textures/model.jpeg', (2760, 2840, 3800, 4880), 'a_bubble', 'bunt', scale=.35, rot=90)
