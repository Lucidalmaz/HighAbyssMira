# Pegel angleichen: Einzelgeräusche je Gruppe auf gleiche Lautheit (LUFS) statt gleicher Spitze – Stinger/Schreckklänge springen sonst von leise zu brüllend.
import sys, os, glob, json, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from klang_lib import *
ZIEL = {'st_klein_': -22, 'st_gross_': -18, 'sc_': -17, 'fx_tropfen_': -26, 'fx_knarren_': -24, 'fx_fluester_': -22, 'fx_hund_': -24, 'fx_reh_': -24, 'fx_tief_': -22, 'pn_': -20, 'kb_klavier_': -19, 'kb_harfe_': -19}
mf = os.path.join(OUT, 'manifest.json'); manifest.update(json.load(open(mf)) if os.path.exists(mf) else {})
for p in sorted(glob.glob(os.path.join(OUT, '*.ogg'))):
    n = os.path.basename(p)[:-4]; z = next((v for k, v in ZIEL.items() if n.startswith(k)), None)
    if z is None: 
        if n not in manifest: x, _ = sf.read(p, dtype='float32'); manifest[n] = {'s': round(len(x) / SR, 2), 'lufs': round(lufs(x), 1), 'pk': round(peak(x), 1), 'kb': round(os.path.getsize(p) / 1024)}
        continue
    x, _ = sf.read(p, dtype='float32')
    if abs(lufs(x) - z) < .7: continue
    save(n, norm(x, z, -3), .9)
json.dump(manifest, open(mf, 'w'), indent=0, sort_keys=True)
