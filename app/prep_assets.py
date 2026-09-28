"""Bereitet die Fab-Downloads fürs Spiel vor: Texturen auf max. 1024 px, Megascans-glTF auf JPG umgestellt,
FBX-Modelle mit verkleinerten Texturen. Ziel: games/birkenhain/assets/<name>/"""
import os, sys, json, shutil, glob
from PIL import Image
sys.path.insert(0, r'C:/Users/GIGABYTE/OneDrive/Dokumente/Unreal Projects/HighAbyssMira/Scripts')
from pack_glb import shrink_one

X = r'C:/Users/GIGABYTE/HAM_FabDownloads/x'
OUT = r'C:/Users/GIGABYTE/OneDrive/Desktop/Claude projekte/games/birkenhain/assets'
os.makedirs(OUT, exist_ok=True)

def img(src, dst, size=1024, keep_alpha=False):
    im = Image.open(src)
    if max(im.size) > size: im.thumbnail((size, size), Image.LANCZOS)
    if keep_alpha or dst.endswith('.png'):
        if not keep_alpha: im = im.convert('RGB')
        im.save(dst, optimize=True)
    else:
        im.convert('RGB').save(dst, quality=86, optimize=True)

def megascans(name, folder, size=1024):
    d = os.path.join(OUT, name); os.makedirs(d, exist_ok=True)
    gl = sorted(glob.glob(os.path.join(X, folder, '*.gltf')))[0]
    g = json.load(open(gl, encoding='utf-8'))
    for im in g.get('images', []):
        src = os.path.join(X, folder, im['uri']); base = os.path.splitext(os.path.basename(im['uri']))[0].replace('4K', '1K')
        alpha = Image.open(src).mode in ('RGBA', 'LA') and '_B' in base  # Albedo mit Maske (z. B. Büsche) behält Alpha
        new = base + ('.png' if alpha else '.jpg'); img(src, os.path.join(d, new), size, alpha); im['uri'] = new; im.pop('mimeType', None)
    for b in g.get('buffers', []):
        shutil.copy(os.path.join(X, folder, b['uri']), os.path.join(d, os.path.basename(b['uri']))); b['uri'] = os.path.basename(b['uri'])
    json.dump(g, open(os.path.join(d, 'model.gltf'), 'w', encoding='utf-8'))
    print(name, 'Bilder:', [i['uri'] for i in g.get('images', [])])

def fbx(name, fbx_path, textures, size=1024):
    d = os.path.join(OUT, name); os.makedirs(d, exist_ok=True)
    shutil.copy(os.path.join(X, fbx_path), os.path.join(d, 'model.fbx'))
    for src, dst in textures.items(): img(os.path.join(X, src), os.path.join(d, dst), size, dst.endswith('.png'))
    print(name, 'fbx +', list(textures.values()))

# Ratte: GLB mit 12 Animationen
os.makedirs(os.path.join(OUT, 'rat'), exist_ok=True)
open(os.path.join(OUT, 'rat', 'rat.glb'), 'wb').write(shrink_one(os.path.join(X, 'ratte', 'blackrat.glb'), 1024))
print('rat.glb', os.path.getsize(os.path.join(OUT, 'rat', 'rat.glb')) // 1024, 'KB')
S = 'spinnen/Spiders - characters with animations/'
fbx('spider_tarantula', S + 'tarantula.fbx', {S + 'Textures/tarantula_difuse.png': 'color.jpg'})
fbx('spider_little', S + 'little_spider.fbx', {S + 'Textures/little_spider_difuse.png': 'color.jpg'}, 512)
fbx('spider_cross', S + 'spider_cross.fbx', {S + 'Textures/spider_cross_difuse.png': 'color.jpg'}, 512)
fbx('bat', 'fledermaus/source/bat_animflapping.fbx', {'fledermaus/textures/Murcielago_body.jpeg': 'color.jpg', 'fledermaus/textures/Murcielago_ojo.jpeg': 'eye.jpg'}, 512)
fbx('fly', 'fliege/Fly.fbx', {'fliege/Textures/TheFly_TheFly_BaseColor.png': 'color.jpg', 'fliege/Textures/TheFly_TheFly_Normal.png': 'normal.jpg'}, 512)
cob = glob.glob(os.path.join(X, 'spinnennetze', 'source', '*'))[0]
fbx('cobwebs', os.path.relpath(cob, X), {'spinnennetze/textures/Texture_Cobwebs_Color.png': 'color.png'}, 1024)
fbx('lamp', 'laterne/source/StreetLamp.fbx', {'laterne/textures/StreetLamp_Body_BaseColor.png': 'color.jpg', 'laterne/textures/StreetLamp_Body_Normal.png': 'normal.jpg', 'laterne/textures/StreetLamp_Light_BaseColor.png': 'light.jpg'})
fbx('swings', 'schaukeln/source/Swings.fbx', {'schaukeln/textures/Swings_Base_color.png': 'color.jpg', 'schaukeln/textures/Swings_Normal_OpenGL.png': 'normal.jpg', 'schaukeln/textures/Swings_Roughness.png': 'rough.jpg', 'schaukeln/textures/Swings_Metallic.png': 'metal.jpg'})
for n, f in [('bench', 'bank'), ('boulder', 'felsen'), ('manhole', 'gully'), ('deadshrubs', 'deadshrubs')]: megascans(n, f)
for n, f in [('forestfloor', 'forestfloor'), ('leaves', 'laub')]:
    d = os.path.join(OUT, n); os.makedirs(d, exist_ok=True)
    for p in glob.glob(os.path.join(X, f, 'Textures', '*')): img(p, os.path.join(d, os.path.basename(p).split('_')[-1].lower().replace('.jpg', '').replace('.png', '') + '.jpg'))
    print(n, os.listdir(d))
tot = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(OUT) for f in fs)
print('Gesamt', tot // (1024 * 1024), 'MB')
