"""Bereitet die neuen Fab/Megascans-Assets fürs Spiel auf: Texturen -> JPG (Alpha bleibt PNG), sinnvolle Größen, glTF-Pfade anpassen."""
import os, json, glob, shutil
from PIL import Image
SRC = r'C:/Users/GIGABYTE/HAM_FabDownloads/v2/x'
OUT = r'C:/Users/GIGABYTE/OneDrive/Desktop/Claude projekte/games/birkenhain/assets/ms'
os.makedirs(OUT, exist_ok=True)

def conv(src, dst_noext, maxs, keep_alpha=False):
    im = Image.open(src)
    alpha = im.mode in ('RGBA', 'LA') and im.getchannel('A').getextrema()[0] < 250
    if max(im.size) > maxs: im.thumbnail((maxs, maxs), Image.LANCZOS)
    if alpha and keep_alpha:
        im.save(dst_noext + '.png', optimize=True); return os.path.basename(dst_noext) + '.png', 'image/png'
    im.convert('RGB').save(dst_noext + '.jpg', quality=88, optimize=True); return os.path.basename(dst_noext) + '.jpg', 'image/jpeg'

def size_for(name, big):
    n = name.lower()
    if big: return 2048
    return 2048 if ('_b.' in n or 'base' in n or 'albedo' in n or 'diff' in n or 'color' in n) else 1024

GLTF = {'deadtree1': True, 'deadtree3': True, 'door1': False, 'door2': False, 'fencepost': False, 'floorlamp': False, 'frame_deco': False, 'frame_dmg': False,
        'metaltable': False, 'shelf': False, 'trashbag': False, 'trashcan': False, 'window': False, 'wallclock': False, 'wardrobe': False, 'radio': False}
for key, big in GLTF.items():
    g = (glob.glob(f'{SRC}/{key}/*.gltf') + glob.glob(f'{SRC}/{key}/*/*.gltf'))[0]
    d = json.load(open(g, encoding='utf-8')); base = os.path.dirname(g); od = f'{OUT}/{key}'; os.makedirs(od, exist_ok=True)
    for b in d.get('buffers', []):
        from urllib.parse import unquote; shutil.copy(os.path.join(base, unquote(b['uri'])), os.path.join(od, 'model.bin')); b['uri'] = 'model.bin'
    for i, im in enumerate(d.get('images', [])):
        from urllib.parse import unquote; src = os.path.join(base, unquote(im['uri']))
        nm, mime = conv(src, os.path.join(od, f't{i}'), size_for(im['uri'], big), keep_alpha=True)
        im['uri'] = nm; im['mimeType'] = mime
    json.dump(d, open(f'{od}/model.gltf', 'w', encoding='utf-8'))
    print(key, 'ok', len(d.get('images', [])), 'Bilder')

SURF = ['wallpaper_old', 'wallpaper_deco', 'wallpaper_fabric', 'floor_worn', 'floor_wood', 'wall_plaster', 'wall_damaged', 'wall_brick', 'grime']
for key in SURF:
    od = f'{OUT}/{key}'; os.makedirs(od, exist_ok=True)
    for f in glob.glob(f'{SRC}/{key}/Textures/*.png') + glob.glob(f'{SRC}/{key}/*.png'):
        n = os.path.basename(f)
        k = 'b' if '_B' in n else 'n' if '_N' in n else 'orm' if '_ORM' in n else None
        if k: conv(f, f'{od}/{k}', 2048 if k != 'orm' else 1024, keep_alpha=(key == 'grime'))
    print(key, os.listdir(od))

FBX = {'crib': 'crib/crib.fbx', 'doll': 'doll/source/doll001.fbx', 'dresser': 'dresser/source/Old Dresser.fbx', 'hospbed': 'hospbed/source/bed.fbx',
       'mirror': 'mirror/source/Mirror.fbx', 'sofa': 'sofa/source/Sofa.fbx', 'chair': 'chair/source/chair/chair.fbx'}
for key, rel in FBX.items():
    od = f'{OUT}/{key}'; os.makedirs(od, exist_ok=True)
    shutil.copy(f'{SRC}/{rel}', f'{od}/model.fbx')
    texs = glob.glob(f'{SRC}/{key}/textures/*') + glob.glob(f'{SRC}/{key}/source/chair/textures/*') + glob.glob(f'{SRC}/{key}/**/*.png', recursive=True)
    done = set()
    for t in texs:
        n = os.path.splitext(os.path.basename(t))[0]
        if n in done or not t.lower().endswith(('.png', '.jpg', '.jpeg', '.tga')): continue
        done.add(n); conv(t, f'{od}/{n}', 2048 if any(s in n.lower() for s in ('base', 'albedo', 'diff', 'color')) else 1024, keep_alpha=True)
    print(key, sorted(os.listdir(od)))
