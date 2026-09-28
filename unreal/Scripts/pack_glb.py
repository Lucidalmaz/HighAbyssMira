"""Führt exportierte GLBs zu einer Datei zusammen und bettet sie ins Browserspiel ein.
Aufruf: python pack_glb.py <Exportordner> <Ausgabe.js> <VARNAME> [max_textur=1024]
- Die erste GLB (0_*.glb) liefert Mesh, Skelett und Materialien; alle weiteren nur ihre Animationen (Zuordnung über Knotennamen).
- Texturen werden auf max_textur verkleinert und als JPEG (Normalen: PNG bleibt PNG) neu kodiert.
Firefox lädt lokale Dateien nicht per fetch – daher als Base64 in einer .js-Datei.
"""
import sys, os, io, json, glob, struct, base64
from PIL import Image

def read_glb(p):
    b = open(p, 'rb').read(); assert b[:4] == b'glTF'
    off, js, bin_ = 12, None, b''
    while off < len(b):
        ln, typ = struct.unpack_from('<I4s', b, off); chunk = b[off + 8: off + 8 + ln]
        if typ == b'JSON': js = json.loads(chunk)
        elif typ == b'BIN\x00': bin_ = chunk
        off += 8 + ln
    return js, bin_

def view_bytes(g, bin_, vi):
    v = g['bufferViews'][vi]; o = v.get('byteOffset', 0); return bin_[o: o + v['byteLength']]

class Builder:
    def __init__(self): self.data = bytearray(); self.views = []
    def add(self, raw, extra=None):
        while len(self.data) % 4: self.data.append(0)
        v = {'buffer': 0, 'byteOffset': len(self.data), 'byteLength': len(raw)}
        if extra: v.update(extra)
        self.data += raw; self.views.append(v); return len(self.views) - 1

def shrink_one(path, maxtex):
    g, bin_ = read_glb(path); B = Builder(); img_views = {im['bufferView']: im for im in g.get('images', []) if 'bufferView' in im}; idx = {}
    for vi, v in enumerate(g['bufferViews']):
        raw = view_bytes(g, bin_, vi)
        if vi in img_views:
            im = Image.open(io.BytesIO(raw)); png = im.mode in ('RGBA', 'LA')
            if max(im.size) > maxtex: im.thumbnail((maxtex, maxtex), Image.LANCZOS)
            buf = io.BytesIO(); (im.save(buf, 'PNG', optimize=True) if png else im.convert('RGB').save(buf, 'JPEG', quality=84, optimize=True)); raw = buf.getvalue(); img_views[vi]['mimeType'] = 'image/png' if png else 'image/jpeg'
        idx[vi] = B.add(raw, {k: v[k] for k in ('byteStride', 'target') if k in v})
    for a in g.get('accessors', []):
        if 'bufferView' in a: a['bufferView'] = idx[a['bufferView']]
    for im in g.get('images', []):
        if 'bufferView' in im: im['bufferView'] = idx[im['bufferView']]
    g['bufferViews'] = B.views; g['buffers'] = [{'byteLength': len(B.data)}]
    return to_glb(g, B)

def to_glb(g, B):
    js = json.dumps(g, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    while len(B.data) % 4: B.data.append(0)
    return b'glTF' + struct.pack('<II', 2, 12 + 8 + len(js) + 8 + len(B.data)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(B.data), b'BIN\x00') + bytes(B.data)

def main(folder, out_js, var, maxtex=1024):
    files = sorted([f for f in glob.glob(os.path.join(folder, '*.glb')) if os.path.basename(f)[0].isdigit()], key=lambda f: int(os.path.basename(f).split('_')[0]))
    g, bin_ = read_glb(files[0]); B = Builder()
    # Pufferansichten neu aufbauen (Bilder dabei verkleinern)
    img_views = {im['bufferView']: im for im in g.get('images', []) if 'bufferView' in im}
    new_index = {}
    for vi, v in enumerate(g['bufferViews']):
        raw = view_bytes(g, bin_, vi)
        if vi in img_views:
            im = Image.open(io.BytesIO(raw)); fmt = 'PNG' if im.mode in ('RGBA', 'LA') else 'JPEG'
            if max(im.size) > maxtex: im.thumbnail((maxtex, maxtex), Image.LANCZOS)
            buf = io.BytesIO(); (im.save(buf, 'PNG', optimize=True) if fmt == 'PNG' else im.convert('RGB').save(buf, 'JPEG', quality=84, optimize=True)); raw = buf.getvalue()
            img_views[vi]['mimeType'] = 'image/png' if fmt == 'PNG' else 'image/jpeg'
        extra = {k: v[k] for k in ('byteStride', 'target') if k in v}
        new_index[vi] = B.add(raw, extra)
    for a in g.get('accessors', []):
        if 'bufferView' in a: a['bufferView'] = new_index[a['bufferView']]
    for im in g.get('images', []):
        if 'bufferView' in im: im['bufferView'] = new_index[im['bufferView']]
    g['bufferViews'] = B.views
    node_by_name = {n.get('name'): i for i, n in enumerate(g['nodes'])}
    # Animationen der weiteren Dateien übernehmen
    for f in files[1:]:
        h, hb = read_glb(f)
        for anim in h.get('animations', []):
            acc_map = {}
            def take_acc(ai):
                if ai in acc_map: return acc_map[ai]
                a = dict(h['accessors'][ai]); raw = view_bytes(h, hb, a['bufferView'])
                a['bufferView'] = B.add(raw)
                g['accessors'].append(a); acc_map[ai] = len(g['accessors']) - 1; return acc_map[ai]
            samplers = [{**s, 'input': take_acc(s['input']), 'output': take_acc(s['output'])} for s in anim['samplers']]
            chans = []
            for c in anim['channels']:
                nm = h['nodes'][c['target']['node']].get('name')
                # Fremdes Skelett: nur Drehungen übernehmen, sonst verzerren sich Knochenlängen (Becken darf sich bewegen)
                if c['target']['path'] != 'rotation' and nm not in ('pelvis',): continue
                if nm in node_by_name: chans.append({'sampler': c['sampler'], 'target': {'node': node_by_name[nm], 'path': c['target']['path']}})
            if chans:
                name = anim.get('name') or os.path.splitext(os.path.basename(f))[0].split('_', 1)[-1]
                g.setdefault('animations', []).append({'name': name, 'samplers': samplers, 'channels': chans})
    g['buffers'] = [{'byteLength': len(B.data)}]
    js = json.dumps(g, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    while len(B.data) % 4: B.data.append(0)
    glb = b'glTF' + struct.pack('<II', 2, 12 + 8 + len(js) + 8 + len(B.data)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(B.data), b'BIN\x00') + bytes(B.data)
    open(os.path.splitext(out_js)[0] + '.glb', 'wb').write(glb)
    extra = ''
    for kind in ('part', 'prop'):
        items = {os.path.basename(f)[len(kind) + 1:-4]: base64.b64encode(shrink_one(f, maxtex)).decode() for f in sorted(glob.glob(os.path.join(folder, kind + '_*.glb')))}
        if items: extra += f'window.{var}_{kind.upper()}S = ' + json.dumps(items) + ';\n'
    open(out_js, 'w', encoding='ascii').write(f'window.{var} = "{base64.b64encode(glb).decode()}";\n' + extra)
    print(f'{len(files)} Dateien -> {len(glb) / 1e6:.1f} MB, Animationen: {[a.get("name") for a in g.get("animations", [])]}')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 1024)
