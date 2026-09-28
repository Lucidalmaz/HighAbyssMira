"""Mesh-GLB + Animations-GLBs mit DEMSELBEN Skelett zu einer GLB zusammenführen (alle Kanäle), Texturen verkleinern.
python pack_same.py <ordner mit 0_mesh.glb, 1_X.glb, …> <ziel.glb> [maxtex]"""
import os, sys, io, json, glob, struct
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pack_glb import read_glb, view_bytes, Builder

def main(folder, out, maxtex=2048):
    files = sorted([f for f in glob.glob(os.path.join(folder, '*.glb')) if os.path.basename(f)[0].isdigit()], key=lambda f: int(os.path.basename(f).split('_')[0]))
    g, bin_ = read_glb(files[0]); B = Builder()
    img_views = {im['bufferView']: im for im in g.get('images', []) if 'bufferView' in im}; new_index = {}
    for vi, v in enumerate(g['bufferViews']):
        raw = view_bytes(g, bin_, vi)
        if vi in img_views:
            im = Image.open(io.BytesIO(raw)); alpha = im.mode in ('RGBA', 'LA') and im.getchannel('A').getextrema()[0] < 250
            if max(im.size) > maxtex: im.thumbnail((maxtex, maxtex), Image.LANCZOS)
            buf = io.BytesIO(); (im.save(buf, 'PNG', optimize=True) if alpha else im.convert('RGB').save(buf, 'JPEG', quality=88, optimize=True)); raw = buf.getvalue()
            img_views[vi]['mimeType'] = 'image/png' if alpha else 'image/jpeg'
        new_index[vi] = B.add(raw, {k: v[k] for k in ('byteStride', 'target') if k in v})
    for a in g.get('accessors', []):
        if 'bufferView' in a: a['bufferView'] = new_index[a['bufferView']]
    for im in g.get('images', []):
        if 'bufferView' in im: im['bufferView'] = new_index[im['bufferView']]
    g['bufferViews'] = B.views
    node_by_name = {n.get('name'): i for i, n in enumerate(g['nodes'])}; names = []
    for f in files[1:]:
        h, hb = read_glb(f)
        for anim in h.get('animations', []):
            acc_map = {}
            def take(ai):
                if ai in acc_map: return acc_map[ai]
                a = dict(h['accessors'][ai]); a['bufferView'] = B.add(view_bytes(h, hb, a['bufferView'])); a.pop('byteOffset', None)
                g['accessors'].append(a); acc_map[ai] = len(g['accessors']) - 1; return acc_map[ai]
            chans, samplers, smap = [], [], {}
            for c in anim['channels']:
                nm = h['nodes'][c['target']['node']].get('name')
                if nm not in node_by_name: continue
                si = c['sampler']
                if si not in smap: s = anim['samplers'][si]; samplers.append({**s, 'input': take(s['input']), 'output': take(s['output'])}); smap[si] = len(samplers) - 1
                chans.append({'sampler': smap[si], 'target': {'node': node_by_name[nm], 'path': c['target']['path']}})
            if chans:
                nm = os.path.splitext(os.path.basename(f))[0].split('_', 1)[-1]; names.append(nm)
                g.setdefault('animations', []).append({'name': nm, 'samplers': samplers, 'channels': chans})
    g['buffers'] = [{'byteLength': len(B.data)}]
    js = json.dumps(g, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    while len(B.data) % 4: B.data.append(0)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'wb').write(b'glTF' + struct.pack('<II', 2, 12 + 8 + len(js) + 8 + len(B.data)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(B.data), b'BIN\x00') + bytes(B.data))
    print(os.path.basename(folder), '->', out, f'{os.path.getsize(out) / 1e6:.1f} MB', len(names), 'Animationen:', names)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 2048)
