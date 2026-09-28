"""Zusatztexturen: Blattform, Fenster mit Vorhang, Fenster mit Silhouette, Ortsschild."""
import os, numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tex'); os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(3)
# Blatt (Farbe + Alpha)
im = Image.new('RGBA', (256, 256), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
d.polygon([(128, 8), (196, 60), (232, 128), (196, 200), (128, 248), (60, 200), (24, 128), (60, 60)], fill=(150, 72, 24, 255))
d.line([(128, 12), (128, 244)], fill=(90, 40, 12, 255), width=4)
for k in range(-3, 4): d.line([(128, 128 + k * 26), (128 + 70 * np.sign(k or 1), 100 + k * 26)], fill=(100, 45, 14, 255), width=2); d.line([(128, 128 + k * 26), (128 - 70 * np.sign(k or 1), 100 + k * 26)], fill=(100, 45, 14, 255), width=2)
a = np.asarray(im).astype(np.float32); a[..., :3] *= (0.85 + rng.random((256, 256, 1)) * 0.3); Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(os.path.join(OUT, 'T_Leaf.png'))
# Fenster mit Vorhang (warm)
def window(fig):
    w, h = 512, 640; y = np.linspace(0, 1, h)[:, None]; x = np.linspace(0, 1, w)[None, :]
    glow = np.exp(-((x - .5) ** 2) / .08 - ((y - .45) ** 2) / .2)
    base = np.dstack([.55 + .45 * glow, .28 + .32 * glow, .08 + .14 * glow])
    folds = .75 + .25 * np.sin(x * 70 + np.sin(y * 9) * 1.5) ** 2
    curtain = (x < .24) | (x > .76)
    img = base * np.where(curtain[..., None], folds[..., None] * .45, 1)
    img *= np.where(curtain, 1, .88 + .12 * np.sin(x * 50) ** 2)[..., None]
    pil = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))
    if fig:
        s = Image.new('L', (w, h), 0); sd = ImageDraw.Draw(s)
        sd.ellipse([222, 150, 302, 250], fill=255); sd.polygon([(150, 640), (175, 320), (225, 270), (300, 270), (350, 320), (372, 640)], fill=255)
        s = s.filter(ImageFilter.GaussianBlur(9)); pil = Image.composite(Image.new('RGB', (w, h), (10, 6, 4)), pil, s.point(lambda v: int(v * .92)))
    return pil
window(False).save(os.path.join(OUT, 'T_WindowCurtain.png')); window(True).save(os.path.join(OUT, 'T_WindowFigure.png'))
# Ortsschild (gelb, deutsch)
im = Image.new('RGB', (1024, 512), (214, 176, 40)); d = ImageDraw.Draw(im)
d.rectangle([14, 14, 1009, 497], outline=(20, 20, 20), width=16)
try: f1 = ImageFont.truetype('arialbd.ttf', 150); f2 = ImageFont.truetype('arial.ttf', 60)
except Exception: f1 = f2 = ImageFont.load_default()
d.text((512, 200), 'Birkenhain', fill=(20, 20, 20), font=f1, anchor='mm'); d.text((512, 360), 'Landkreis Wendstedt', fill=(20, 20, 20), font=f2, anchor='mm')
arr = np.asarray(im).astype(np.float32); dirt = np.asarray(Image.fromarray((rng.random((64, 128)) * 255).astype(np.uint8)).resize((1024, 512), Image.BICUBIC), np.float32)[..., None] / 255
arr *= .8 + .2 * dirt; arr[400:, :] *= np.linspace(1, .7, 112)[:, None, None]
Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(os.path.join(OUT, 'T_TownSign.png'))
print('ok')
