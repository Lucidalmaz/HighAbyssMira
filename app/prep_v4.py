"""Dritte Asset-Welle (Erweiterung: Kirchberg, Landstraße, Schrebergärten/Hof). Entpacken, Modelldatei finden, Texturen verkleinern,
schwere Modelle mit gltfpack vereinfachen. Ausgabe nach assets/ms/<key>/ + Katalog mods/CATALOG_V4.md"""
import os, sys, json, glob, shutil, zipfile, subprocess, struct, io
from urllib.parse import unquote
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prep_v3 import conv, big, gltf_model, glb_repack  # noqa (prep_v3 läuft beim Import NICHT erneut: siehe Guard unten)
SRC = r'C:/Users/GIGABYTE/HAM_FabDownloads/v4'
X = SRC + '/x'
OUT = r'C:/Users/GIGABYTE/OneDrive/Desktop/Claude projekte/games/birkenhain/assets/ms'
APP = r'C:/Users/GIGABYTE/HighAbyssMira-App'
os.makedirs(X, exist_ok=True)
only = set(sys.argv[1:])
cat = []

def tris_gltf(d):
    t = 0
    for m in d.get('meshes', []):
        for p in m['primitives']:
            if 'indices' in p: t += d['accessors'][p['indices']]['count'] // 3
    return t

def gltfpack(src, dst, si):
    r = subprocess.run(f'npx -y gltfpack -i "{src}" -o "{dst}" -si {si} -kn -km', shell=True, cwd=APP, capture_output=True, text=True)
    if r.returncode: raise RuntimeError(r.stderr[-400:])

for f in sorted(os.listdir(SRC)):
    p = os.path.join(SRC, f)
    if not os.path.isfile(p) or f.endswith('.txt'): continue
    key, ext = os.path.splitext(f); ext = ext.lower()
    if only and key not in only: continue
    xd = os.path.join(X, key); os.makedirs(xd, exist_ok=True)
    try:
        if ext == '.zip':
            with zipfile.ZipFile(p) as z: z.extractall(xd)
            for inner in glob.glob(xd + '/**/*.zip', recursive=True):
                try:
                    with zipfile.ZipFile(inner) as z: z.extractall(os.path.dirname(inner))
                except Exception: pass
            for rar in glob.glob(xd + '/**/*.rar', recursive=True): subprocess.run(['C:/Windows/System32/tar.exe', '-xf', rar, '-C', os.path.dirname(rar)])
        else: shutil.copy(p, os.path.join(xd, f))
        files = [q for q in glob.glob(xd + '/**/*', recursive=True) if os.path.isfile(q)]
        gl = [q for q in files if q.lower().endswith('.gltf')]; gl = [q for q in gl if 'nonue' in q.lower()] or [q for q in gl if 'tier_2' in q] or gl
        glbs = [q for q in files if q.lower().endswith('.glb')]; fbx = [q for q in files if q.lower().endswith('.fbx')]; objs = [q for q in files if q.lower().endswith('.obj')]
        od = os.path.join(OUT, key); os.makedirs(od, exist_ok=True); note = ''
        if gl:
            d = json.load(open(gl[0], encoding='utf-8')); t = tris_gltf(d)
            if t > 150000:
                tmp = os.path.join(xd, '_packed.glb'); gltfpack(gl[0], tmp, round(max(.05, 120000 / t), 3)); glb_repack(tmp, od + '/model.glb'); note = f'glb (vereinfacht von {t} Dreiecken)'
            else: gltf_model(key, gl[0]); note = f'gltf {t} Dreiecke'
        elif glbs:
            b = open(glbs[0], 'rb').read(); n = struct.unpack('<I', b[12:16])[0]; d = json.loads(b[20:20 + n]); t = tris_gltf(d)
            if t > 150000:
                tmp = os.path.join(xd, '_packed.glb'); gltfpack(glbs[0], tmp, round(max(.05, 120000 / t), 3)); glb_repack(tmp, od + '/model.glb'); note = f'glb (vereinfacht von {t} Dreiecken)'
            else: glb_repack(glbs[0], od + '/model.glb'); note = f'glb {t} Dreiecke'
        elif fbx:
            for i, q in enumerate(sorted(fbx, key=os.path.getsize, reverse=True)):
                shutil.copy(q, os.path.join(od, 'model.fbx' if i == 0 else os.path.basename(q)))
            note = 'fbx: ' + ', '.join(os.path.basename(q) for q in fbx)
        elif objs:
            shutil.copy(objs[0], os.path.join(od, 'model.obj')); note = 'obj (OBJLoader nötig): ' + os.path.basename(objs[0])
        if not gl and not glbs:  # lose Texturen mitnehmen
            done = set()
            for t in files:
                if not t.lower().endswith(('.png', '.jpg', '.jpeg', '.tga', '.tif', '.tiff')): continue
                n = os.path.splitext(os.path.basename(t))[0]
                if n in done: continue
                done.add(n)
                try: conv(t, os.path.join(od, n), 2048 if big(os.path.basename(t)) else 1024)
                except Exception as e: print('  Textur übersprungen', t, e)
        sz = sum(os.path.getsize(q) for q in glob.glob(od + '/*')) / 1e6
        cat.append(f'- **{key}**: {note}; Dateien: {", ".join(sorted(os.listdir(od)))[:300]} ({sz:.1f} MB)')
        print(key, 'ok', note)
    except Exception as e:
        cat.append(f'- **{key}**: FEHLER {e}'); print(key, 'FEHLER', e)

with open(APP + '/mods/CATALOG_V4.md', 'a' if only else 'w', encoding='utf-8') as fh:
    if not only: fh.write('# Katalog Erweiterungs-Assets (assets/ms/<key>)\nVorschau: node tools/work.js run <bereich> tools/steps_preview.json work/_out_pv 60 "preview.html?a=ms/<key>&file=model.glb" (bzw. model.gltf; FBX: &f=fbx)\n\n')
    fh.write('\n'.join(cat) + '\n')
