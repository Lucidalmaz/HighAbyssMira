"""Poly Haven liefert Blätter, Nadeln, Maschendraht und Glas im glTF als JPG ohne Transparenz.
Die Maske liegt als eigene *_alpha.png vor. Dieses Skript lädt die Masken, baut RGBA-Texturen
und stellt die betroffenen Materialien im glTF auf MASK (Glas: BLEND) um. Original bleibt als .orig."""
import os, json, glob, shutil, urllib.request
from PIL import Image

MODELS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'polyhaven', 'models')
UA = {'User-Agent': 'HighAbyssMira-asset-fix'}

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()

def fix(mid):
    files = json.loads(get(f'https://api.polyhaven.com/files/{mid}'))
    parts = [k[:-6] for k in files if k.endswith('_alpha')]
    folder = os.path.join(MODELS, mid)
    gl = glob.glob(os.path.join(folder, '*.gltf'))[0]
    g0 = json.load(open(gl + '.orig' if os.path.exists(gl + '.orig') else gl, encoding='utf-8'))
    # Nanite kann nur deckende oder maskierte Materialien: alles außer Glas mit BLEND wird MASK
    blend = [m['name'] for m in g0['materials'] if m.get('alphaMode') == 'BLEND' and 'glass' not in m['name'] and not any(m['name'] == f'{mid}_{p}' for p in parts)]
    if not parts and not blend: return
    if not os.path.exists(gl + '.orig'): shutil.copy(gl, gl + '.orig')
    g = g0
    for m in g['materials']:
        if m['name'] in blend: m['alphaMode'] = 'MASK'; m['alphaCutoff'] = 0.5; print(mid, m['name'], 'BLEND -> MASK')
    for part in parts:
        mat = next((m for m in g['materials'] if m['name'] == f'{mid}_{part}'), None)
        if not mat: print('kein Material für', mid, part); continue
        bc = mat['pbrMetallicRoughness']['baseColorTexture']
        tex = g['textures'][bc['index']]; diff_uri = g['images'][tex['source']]['uri']
        apath = os.path.join(folder, 'textures', f'{mid}_{part}_alpha_2k.png')
        if not os.path.exists(apath):
            with open(apath, 'wb') as fh: fh.write(get(files[f'{part}_alpha']['2k']['png']['url']))
        rgb = Image.open(os.path.join(folder, diff_uri)).convert('RGB')
        a = Image.open(apath).convert('L').resize(rgb.size, Image.LANCZOS)
        out_uri = f'textures/{mid}_{part}_diffa_2k.png'
        Image.merge('RGBA', (*rgb.split(), a)).save(os.path.join(folder, out_uri))
        g['images'].append({'uri': out_uri, 'mimeType': 'image/png'})
        nt = dict(tex); nt['source'] = len(g['images']) - 1; g['textures'].append(nt)
        bc['index'] = len(g['textures']) - 1
        if part == 'glass': mat['alphaMode'] = 'BLEND'
        else: mat['alphaMode'] = 'MASK'; mat['alphaCutoff'] = 0.5
        mat['doubleSided'] = True
        print(mid, part, '->', mat['alphaMode'], out_uri)
    json.dump(g, open(gl, 'w', encoding='utf-8'), indent=1)

for mid in sorted(os.listdir(MODELS)):
    try: fix(mid)
    except Exception as e: print('FEHLER', mid, e)
