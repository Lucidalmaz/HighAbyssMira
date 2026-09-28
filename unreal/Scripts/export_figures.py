"""Sucht in der eigenen Unreal-Bibliothek Figuren (Skeletal Meshes) für High Abyss Mira und exportiert sie mit Animationen ins Spiel:
<Repo>/game/assets/ue/chars/<rolle>/ 0_mesh.glb + je Animation eine GLB + manifest.json  (liest mods/figuren.js)
Rollen: kind_junge, kind_maedchen (Echo-Kinder), erwachsener (Echo-Erwachsene), alter_mann (Walter Albers).
Aufruf: Export_Figuren.bat (Doppelklick) – oder UnrealEditor-Cmd.exe <Projekt> -ExecutePythonScript="<Repo>/unreal/Scripts/export_figures.py"
Eigene Wahl erzwingen: unreal/Scripts/export_figures_pick.json  {"alter_mann": "/Game/…/SK_OldMan"}
Animationen: nur solche mit demselben Skelett (Idle/Walk/Talk werden gesucht). Log mit allen Kandidaten: unreal/Scripts/export_figures_log.txt
"""
import os, re, json, unreal

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.environ.get('HAM_REPO') or os.path.join(HERE, '..', '..'))
OUT = os.path.join(REPO, 'game', 'assets', 'ue', 'chars')
AR = unreal.AssetRegistryHelpers.get_asset_registry()
ROLES = {  # Rolle: (Suchbegriffe, Ausschlüsse)
    'kind_junge':    (['boy', 'kid', 'child', 'junge', 'son', 'teen_m'], ['girl', 'female', 'daughter']),
    'kind_maedchen': (['girl', 'daughter', 'maedchen', 'kid_f', 'child_f', 'teen_f'], ['boy']),
    'alter_mann':    (['old_man', 'oldman', 'elder', 'grandpa', 'grandfather', 'senior', 'old', 'hobo', 'beggar', 'farmer', 'peasant'], ['female', 'woman', 'girl']),
    'erwachsener':   (['man', 'male', 'civilian', 'worker', 'agent', 'officer', 'suit', 'doctor'], ['female', 'woman', 'girl', 'boy', 'kid', 'child', 'mannequin', 'quinn', 'manny']),
}
ANIMS = {'idle': ['idle', 'breath', 'stand'], 'walk': ['walk'], 'talk': ['talk', 'convers', 'gesture', 'explain']}

def words(p):
    return re.sub(r'([a-z])([A-Z])', r'\1_\2', p.split('/')[-1]).lower()

def assets(cls):
    f = unreal.ARFilter(class_paths=[unreal.TopLevelAssetPath('/Script/Engine', cls)], package_paths=['/Game'], recursive_paths=True)
    return [str(a.package_name) for a in AR.get_assets(f)]

def opts(preview):
    o = unreal.GLTFExportOptions()
    for k, v in [('export_preview_mesh', preview), ('export_animation_sequences', True), ('export_vertex_skin_weights', True), ('export_morph_targets', False),
                 ('texture_image_format', unreal.GLTFTextureImageFormat.JPEG), ('texture_image_quality', 88), ('export_unlit_materials', False),
                 ('bake_material_inputs', unreal.GLTFMaterialBakeMode.USE_MESH_DATA), ('export_lights', False), ('export_cameras', False)]:
        try: o.set_editor_property(k, v)
        except Exception as e: unreal.log_warning(f'Option {k}: {e}')
    try:
        bs = o.get_editor_property('default_material_bake_size'); bs.set_editor_property('size', unreal.GLTFMaterialBakeSize.POT_2048); o.set_editor_property('default_material_bake_size', bs)
    except Exception as e: unreal.log_warning(f'Bake-Größe: {e}')
    return o

def main():
    meshes = assets('SkeletalMesh'); anims = {}
    for a in assets('AnimSequence'):
        try: s = unreal.load_asset(a).get_editor_property('skeleton'); anims.setdefault(s.get_path_name() if s else '?', []).append(a)
        except Exception: pass
    log = [f'{len(meshes)} Skeletal Meshes, {sum(len(v) for v in anims.values())} Animationen unter /Game', f'Ziel: {OUT}', '']
    pick_file = os.path.join(HERE, 'export_figures_pick.json'); forced = json.load(open(pick_file, encoding='utf-8')) if os.path.exists(pick_file) else {}
    used = set()
    for role, (keys, bad) in ROLES.items():
        cands = []
        for p in meshes:
            w = words(p); hit = [k for k in keys if k in w]
            if not hit or any(b in w for b in bad): continue
            try: sk = unreal.load_asset(p).get_editor_property('skeleton'); n = len(anims.get(sk.get_path_name(), [])) if sk else 0
            except Exception: n = 0
            cands.append(((-len(hit), keys.index(hit[0]), -min(n, 50)), p, n))
        cands.sort(); log.append(f'[{role}] {len(cands)} Kandidaten'); log += [f'    {p}  ({n} Animationen mit gleichem Skelett)' for _, p, n in cands[:10]]
        choice = forced.get(role) or next((p for _, p, _ in cands if p not in used), None)
        if not choice: log.append('    → nichts Passendes, übersprungen'); continue
        used.add(choice); mesh = unreal.load_asset(choice); d = os.path.join(OUT, role); os.makedirs(d, exist_ok=True)
        ok = unreal.GLTFExporter.export_to_gltf(mesh, os.path.join(d, '0_mesh.glb'), opts(True), set())
        man = {'mesh': '0_mesh.glb', 'anims': {}, 'yaw': 0, 'source': choice}
        sk = mesh.get_editor_property('skeleton'); pool = anims.get(sk.get_path_name(), []) if sk else []
        for key, kw in ANIMS.items():
            a = next((x for x in pool if any(k in words(x) for k in kw) and 'root' not in words(x)), None)
            if not a: continue
            fn = f'{len(man["anims"]) + 1}_{key}.glb'
            if unreal.GLTFExporter.export_to_gltf(unreal.load_asset(a), os.path.join(d, fn), opts(False), set()): man['anims'][key] = fn
        json.dump(man, open(os.path.join(d, 'manifest.json'), 'w', encoding='utf-8'), indent=1)
        log.append(f'    → exportiert: {choice} ({"ok" if ok else "FEHLER"}), Animationen: {", ".join(man["anims"]) or "keine (steht in Grundhaltung)"}')
    open(os.path.join(HERE, 'export_figures_log.txt'), 'w', encoding='utf-8').write('\n'.join(log))

try:
    main()
except Exception:
    import traceback; open(os.path.join(HERE, 'export_figures_log.txt'), 'w', encoding='utf-8').write(traceback.format_exc())
