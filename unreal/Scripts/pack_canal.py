"""Fügt alle Kanal-Bauteile (je eine GLB) zu einer GLB zusammen: ein Knoten pro Bauteil (Name = Mesh-Name),
doppelte Bilder nur einmal, Texturen verkleinert. Dazu instances.json für die Platzierung im Spiel."""
import os, sys, io, json, glob, hashlib, shutil, struct
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pack_glb import read_glb, view_bytes, Builder
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'Saved', 'GameExport', 'canal_parts')
OUT = r'C:/Users/GIGABYTE/OneDrive/Desktop/Claude projekte/games/birkenhain/assets/canal'
os.makedirs(OUT, exist_ok=True)
MAXT = 1024
G = {'asset': {'version': '2.0'}, 'scene': 0, 'scenes': [{'nodes': []}], 'nodes': [], 'meshes': [], 'materials': [], 'textures': [], 'images': [], 'samplers': [], 'accessors': [], 'bufferViews': []}
B = Builder(); img_by_hash = {}; smp_by_key = {}
def small_image(raw):
    im = Image.open(io.BytesIO(raw)); alpha = im.mode in ('RGBA', 'LA') and im.getchannel('A').getextrema()[0] < 250
    if max(im.size) > MAXT: im.thumbnail((MAXT, MAXT), Image.LANCZOS)
    buf = io.BytesIO()
    if alpha: im.save(buf, 'PNG', optimize=True); return buf.getvalue(), 'image/png'
    im.convert('RGB').save(buf, 'JPEG', quality=82, optimize=True); return buf.getvalue(), 'image/jpeg'
files = sorted(glob.glob(os.path.join(SRC, '*.glb')))
for f in files:
    name = os.path.splitext(os.path.basename(f))[0]
    g, b = read_glb(f)
    vmap = {}
    def view(vi, extra=None):
        if vi not in vmap: v = g['bufferViews'][vi]; vmap[vi] = B.add(view_bytes(g, b, vi), {k: v[k] for k in ('byteStride', 'target') if k in v}); G['bufferViews'] = B.views
        return vmap[vi]
    amap = {}
    def acc(ai):
        if ai not in amap: a = dict(g['accessors'][ai]); a['bufferView'] = view(a['bufferView']); G['accessors'].append(a); amap[ai] = len(G['accessors']) - 1
        return amap[ai]
    imap = {}
    def image(ii):
        if ii in imap: return imap[ii]
        raw = view_bytes(g, b, g['images'][ii]['bufferView']); h = hashlib.md5(raw).hexdigest()
        if h not in img_by_hash:
            data, mime = small_image(raw); G['images'].append({'bufferView': B.add(data), 'mimeType': mime}); G['bufferViews'] = B.views; img_by_hash[h] = len(G['images']) - 1
        imap[ii] = img_by_hash[h]; return imap[ii]
    tmap = {}
    def texture(ti):
        if ti in tmap: return tmap[ti]
        t = g['textures'][ti]; nt = {'source': image(t['source'])}
        if 'sampler' in t:
            s = g['samplers'][t['sampler']]; key = json.dumps(s, sort_keys=True)
            if key not in smp_by_key: G['samplers'].append(s); smp_by_key[key] = len(G['samplers']) - 1
            nt['sampler'] = smp_by_key[key]
        G['textures'].append(nt); tmap[ti] = len(G['textures']) - 1; return tmap[ti]
    def fix_tex(o):
        if isinstance(o, dict):
            for k, v in list(o.items()):
                if k == 'index' and 'texCoord' in o or (k == 'index' and isinstance(v, int) and set(o.keys()) <= {'index', 'texCoord', 'scale', 'strength', 'extensions'}): o[k] = texture(v)
                else: fix_tex(v)
        elif isinstance(o, list):
            for x in o: fix_tex(x)
    mmap = {}
    def material(mi):
        if mi not in mmap: m = json.loads(json.dumps(g['materials'][mi])); fix_tex(m); G['materials'].append(m); mmap[mi] = len(G['materials']) - 1
        return mmap[mi]
    for n in g['nodes']:
        if 'mesh' not in n: continue
        me = json.loads(json.dumps(g['meshes'][n['mesh']]))
        for p in me['primitives']:
            p['attributes'] = {k: acc(v) for k, v in p['attributes'].items() if k in ('POSITION', 'NORMAL', 'TEXCOORD_0', 'TANGENT')}
            if 'indices' in p: p['indices'] = acc(p['indices'])
            if 'material' in p: p['material'] = material(p['material'])
        me['name'] = name; G['meshes'].append(me)
        node = {'name': name, 'mesh': len(G['meshes']) - 1}
        for k in ('translation', 'rotation', 'scale'):
            if k in n: node[k] = n[k]
        G['nodes'].append(node); G['scenes'][0]['nodes'].append(len(G['nodes']) - 1)
        break  # ein Mesh pro Bauteil
G['buffers'] = [{'byteLength': len(B.data)}]
for k in ('samplers',):
    if not G[k]: del G[k]
js = json.dumps(G, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
while len(B.data) % 4: B.data.append(0)
glb = b'glTF' + struct.pack('<II', 2, 12 + 8 + len(js) + 8 + len(B.data)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(B.data), b'BIN' + bytes([0])) + bytes(B.data)
open(os.path.join(OUT, 'canal_parts.glb'), 'wb').write(glb)
shutil.copy(os.path.join(SRC, 'instances.json'), os.path.join(OUT, 'instances.json'))
meta = os.path.join(SRC, '..', 'canal', 'canal_meta.json')
if os.path.exists(meta): shutil.copy(meta, os.path.join(OUT, 'canal_meta.json'))
print(len(files), 'Bauteile,', len(G['images']), 'Bilder (dedupliziert),', round(len(glb) / 1e6, 1), 'MB')
