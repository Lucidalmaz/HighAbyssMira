"""Zweite Asset-Welle: Straße, Autos, Pflanzen, Fassaden, Blut. Texturen -> JPG/PNG passend groß, glTF-Pfade anpassen, FBX + Texturen kopieren."""
import os, json, glob, shutil, struct, io, subprocess
from urllib.parse import unquote
from PIL import Image
SRC = r'C:/Users/GIGABYTE/HAM_FabDownloads/v3/x'
OUT = r'C:/Users/GIGABYTE/OneDrive/Desktop/Claude projekte/games/birkenhain/assets/ms'
APP = r'C:/Users/GIGABYTE/HighAbyssMira-App'

def conv(src, dst_noext, maxs, keep_alpha=True):
    im = Image.open(src)
    alpha = im.mode in ('RGBA', 'LA', 'P') and im.convert('RGBA').getchannel('A').getextrema()[0] < 250
    if max(im.size) > maxs: im.thumbnail((maxs, maxs), Image.LANCZOS)
    if alpha and keep_alpha:
        im.convert('RGBA').save(dst_noext + '.png', optimize=True); return os.path.basename(dst_noext) + '.png', 'image/png'
    im.convert('RGB').save(dst_noext + '.jpg', quality=88, optimize=True); return os.path.basename(dst_noext) + '.jpg', 'image/jpeg'

def big(name): n = name.lower(); return any(s in n for s in ('_b.', '_b-o', 'base', 'albedo', 'diff', 'color', '_d.'))

def gltf_model(key, g, maxs=None):
    d = json.load(open(g, encoding='utf-8')); base = os.path.dirname(g); od = f'{OUT}/{key}'; os.makedirs(od, exist_ok=True)
    for i, b in enumerate(d.get('buffers', [])):
        nm = 'model.bin' if i == 0 else f'model{i}.bin'; shutil.copy(os.path.join(base, unquote(b['uri'])), os.path.join(od, nm)); b['uri'] = nm
    for i, im in enumerate(d.get('images', [])):
        src_img = os.path.join(base, unquote(im['uri']))
        if not os.path.exists(src_img):  # Texturen liegen oft in einem Unterordner
            hits = glob.glob(os.path.join(base, '**', os.path.basename(unquote(im['uri']))), recursive=True)
            if hits: src_img = hits[0]
        nm, mime = conv(src_img, os.path.join(od, f't{i}'), maxs or (2048 if big(im['uri']) else 1024))
        im['uri'] = nm; im['mimeType'] = mime
    json.dump(d, open(f'{od}/model.gltf', 'w', encoding='utf-8')); print(key, 'gltf ok', len(d.get('images', [])), 'Bilder')

def glb_repack(src, dst, maxs=2048):
    b = open(src, 'rb').read(); n = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + n]); off = 20 + n; bl = struct.unpack('<I', b[off:off + 4])[0]; bin_ = b[off + 8:off + 8 + bl]
    imgv = {i['bufferView']: k for k, i in enumerate(j.get('images', []))}; out = bytearray(); views = []
    for vi, v in enumerate(j['bufferViews']):
        data = bin_[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
        if vi in imgv:
            im = Image.open(io.BytesIO(data)); im.thumbnail((maxs, maxs), Image.LANCZOS); bio = io.BytesIO()
            if im.mode in ('RGBA', 'LA') and im.getchannel('A').getextrema()[0] < 250: im.save(bio, 'PNG', optimize=True); j['images'][imgv[vi]]['mimeType'] = 'image/png'
            else: im.convert('RGB').save(bio, 'JPEG', quality=88); j['images'][imgv[vi]]['mimeType'] = 'image/jpeg'
            data = bio.getvalue()
        while len(out) % 4: out.append(0)
        nv = dict(v); nv['byteOffset'] = len(out); nv['byteLength'] = len(data); nv.pop('byteStride', None) if vi in imgv else None; out += data; views.append(nv)
    j['bufferViews'] = views; j['buffers'] = [{'byteLength': len(out)}]
    while len(out) % 4: out.append(0)
    js = json.dumps(j, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    open(dst, 'wb').write(b'glTF' + struct.pack('<II', 2, 12 + 8 + len(js) + 8 + len(out)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I', len(out)) + b'BIN\x00' + bytes(out))
    print(os.path.basename(os.path.dirname(dst)), 'glb', round(len(out) / 1e6, 1), 'MB')

def gltfpack(src, dst, si):
    subprocess.run(f'npx -y gltfpack -i "{src}" -o "{dst}" -si {si} -kn -km', shell=True, cwd=APP, check=True, capture_output=True)

if __name__ == '__main__':
    # --- Megascans-Modelle (Laub: die nonUE-Variante mit normalen Materialien)
    MODELS = {'asphalt_debris': 'tlhjacuva_tier_2.gltf', 'curbs': 'sepxW_tier_2.gltf', 'hydrant': 'SM_uh4ocfafa_tier_2.gltf', 'mailbox2': 'ujijbfhba_tier_2.gltf',
              'parksign': 'SM_uknkefiqx_tier_2.gltf', 'pole_old': 'ueqfdi0ga_tier_2.gltf',
              'elderberry': 'standard/wfzobb2ia_tier_2_nonUE.gltf', 'spindle': 'standard/wk1ncbxja_tier_2_nonUE.gltf', 'raspberry': 'standard/wf0oefeja_tier_2_nonUE.gltf',
              'wildgrass1': 'standard/vlkhcbxia_tier_2_nonUE.gltf', 'wildgrass2': 'standard/vczndjqja_tier_2_nonUE.gltf'}
    for k, f in MODELS.items(): gltf_model(k, f'{SRC}/{k}/{f}')

    # --- Oberflächen und Decals (je 2 × 2 m)
    SURF = ['asphalt_road2', 'road_asphalt', 'wet_asphalt', 'bark', 'corrugated', 'facade_brick', 'facade_concrete', 'garagedoor', 'gravel', 'lawn1', 'pavement',
            'planks_painted', 'rust_sheet', 'sidewalk_tiles', 'blood_hv', 'blood_s1', 'blood_s2']
    for key in SURF:
        od = f'{OUT}/{key}'; os.makedirs(od, exist_ok=True)
        for f in glob.glob(f'{SRC}/{key}/Textures/*.png') + glob.glob(f'{SRC}/{key}/*.png'):
            n = os.path.basename(f)
            k = 'b' if ('_B.' in n or '_B-O' in n or '_B_' in n) else 'n' if '_N.' in n else 'orm' if '_ORM' in n else None
            if k: conv(f, f'{od}/{k}', 2048 if k != 'orm' else 1024)
        print(key, sorted(os.listdir(od)))

    # --- FBX mit losen Texturen
    FBX = {'car_amsedan': ('car_amsedan/Assets', None), 'car_burned': ('car_burned/source/burnedcars.FBX', 'car_burned/source'), 'car_junk': ('car_junk/source/SM_JUNKCAR1_DEFORMED2.fbx', 'car_junk'),
           'vans': ('vans/source/vans.FBX', 'vans/source'), 'curtain_retro': ('curtain_retro/source/curtainroom.fbx', 'curtain_retro'), 'curtain_sheer': ('curtain_sheer/source/curtain.fbx', 'curtain_sheer'),
           'fence_dirty': ('fence_dirty/fence_dirty.fbx', 'fence_dirty'), 'fence_garden': ('fence_garden/source/barrière PM.fbx', 'fence_garden'), 'mailbox_cc0': ('mailbox_cc0/source/Mailbox.fbx', 'mailbox_cc0'),
           'mansion': ('mansion/mansion.fbx', 'mansion'), 'poles_wood': ('poles_wood', 'poles_wood'), 'roadsigns': ('roadsigns/source/rs/road_sign_pack.fbx', 'roadsigns/source/rs')}
    for key, (rel, texdir) in FBX.items():
        od = f'{OUT}/{key}'; os.makedirs(od, exist_ok=True); p = f'{SRC}/{rel}'
        if os.path.isdir(p):
            for f in glob.glob(p + '/*.fbx') + glob.glob(p + '/*.FBX'): shutil.copy(f, f'{od}/{os.path.basename(f).replace(".FBX", ".fbx")}')
        else: shutil.copy(p, f'{od}/model.fbx')
        done = set()
        for t in glob.glob(f'{SRC}/{texdir or os.path.dirname(rel)}/**/*', recursive=True):
            if not t.lower().endswith(('.png', '.jpg', '.jpeg', '.tga')): continue
            n = os.path.splitext(os.path.basename(t))[0]
            if n in done: continue
            done.add(n); conv(t, f'{od}/{n}', 2048 if big(os.path.basename(t)) else 1024)
        print(key, sorted(os.listdir(od))[:24])

    # --- GLB: weißer Zaun; schwere Scans vereinfachen
    os.makedirs(f'{OUT}/fence_white', exist_ok=True); glb_repack(f'{SRC}/fence_white/WhiteWoodFence.glb', f'{OUT}/fence_white/model.glb')
    for key, src, si in [('car_dutch', f'{SRC}/car_dutch/car_dutch.glb', .06), ('car_rusty', f'{SRC}/car_rusty/gltf/gltf.gltf', .25)]:
        os.makedirs(f'{OUT}/{key}', exist_ok=True); tmp = f'{SRC}/{key}/_packed.glb'
        gltfpack(src, tmp, si); glb_repack(tmp, f'{OUT}/{key}/model.glb')
