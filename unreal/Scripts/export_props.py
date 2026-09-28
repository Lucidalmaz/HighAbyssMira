"""Sucht in der eigenen Unreal-Bibliothek (Fab, Megascans, Marketplace unter /Game) Requisiten für High Abyss Mira
und exportiert je Rolle das beste Modell als GLB direkt ins Spiel: <Repo>/game/assets/ue/<rolle>/model.glb
Aufruf (headless, macht Export_Requisiten.bat automatisch):
  UnrealEditor-Cmd.exe <Projekt>.uproject -ExecutePythonScript="<Repo>/unreal/Scripts/export_props.py" -unattended -nosplash
Ergebnis: game/assets/ue/<rolle>/model.glb + info.json (Quelle, Größe), dazu unreal/Scripts/export_props_log.txt mit allen Kandidaten.
Eine Rolle ohne passenden Fund wird übersprungen – das Spiel nutzt dann weiter die vorhandenen Assets.
Eigene Wahl erzwingen: unreal/Scripts/export_props_pick.json  {"lampe1": "/Game/…/SM_Flashlight_01", …}
"""
import os, re, json, unreal

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.environ.get('HAM_REPO') or os.path.join(HERE, '..', '..'))
OUT = os.path.join(REPO, 'game', 'assets', 'ue')
AR = unreal.AssetRegistryHelpers.get_asset_registry()

# Rolle: (Suchbegriffe, Ausschlüsse, größte Ausdehnung min/max in cm)
ROLES = {
    'lampe1':         (['flashlight', 'torch_hand', 'handlamp', 'hand_lamp', 'pocket_lamp'], ['fire', 'wall', 'street', 'ceiling'], 12, 45),
    'lampe2':         (['flashlight', 'maglite', 'police_light', 'led_torch', 'tactical_light'], ['fire', 'wall', 'street'], 18, 60),
    'lampe3':         (['lantern_handheld', 'spotlight_hand', 'searchlight', 'work_light', 'worklight', 'lantern'], ['street', 'ceiling', 'candle'], 20, 70),
    'batterie':       (['battery', 'batteries', 'cell_aa', 'd_cell'], ['car', 'truck'], 3, 20),
    'drahtschneider': (['wire_cutter', 'wirecutter', 'bolt_cutter', 'boltcutter', 'cutter', 'pliers', 'nipper'], ['paper', 'box', 'laser'], 15, 90),
    'brechstange':    (['crowbar', 'crow_bar', 'pry_bar', 'prybar', 'wrecking_bar'], [], 40, 120),
    'sicherung':      (['fuse', 'ceramic_fuse', 'circuit_fuse'], ['box', 'panel'], 3, 20),
    'lichtstein':     (['pebble', 'rock_small', 'stone_small', 'small_rock', 'river_stone', 'gravel_stone', 'rock'], ['cliff', 'wall', 'large', 'huge', 'mountain', 'formation'], 8, 45),
    'wrack':          (['scrap_metal', 'metal_scrap', 'metal_debris', 'debris_metal', 'sheet_metal', 'wreck', 'metal_panel', 'scrap'], ['car', 'wood'], 40, 250),
    'leiter':         (['ladder', 'leiter', 'rung_ladder', 'maintenance_ladder'], ['step_ladder', 'wood'], 150, 600),
    'totem':          (['totem', 'effigy', 'idol', 'shrine', 'wicker', 'voodoo', 'stick_figure', 'fetish', 'ritual'], ['fire'], 50, 260),
}

def words(path):
    return re.sub(r'([a-z])([A-Z])', r'\1_\2', path.split('/')[-1]).lower()

def size_cm(mesh):
    try: b = mesh.get_bounding_box(); return max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z)
    except Exception: return -1

def tris(mesh):
    try: return mesh.get_num_triangles(0)
    except Exception: return 10 ** 7

def opts():
    o = unreal.GLTFExportOptions()
    for k, v in [('export_preview_mesh', False), ('texture_image_format', unreal.GLTFTextureImageFormat.JPEG), ('texture_image_quality', 88),
                 ('export_unlit_materials', False), ('bake_material_inputs', unreal.GLTFMaterialBakeMode.USE_MESH_DATA), ('export_lights', False), ('export_cameras', False)]:
        try: o.set_editor_property(k, v)
        except Exception as e: unreal.log_warning(f'Option {k}: {e}')
    try:
        bs = o.get_editor_property('default_material_bake_size'); bs.set_editor_property('size', unreal.GLTFMaterialBakeSize.POT_1024); o.set_editor_property('default_material_bake_size', bs)
    except Exception as e: unreal.log_warning(f'Bake-Größe: {e}')
    return o

def main():
    flt = unreal.ARFilter(class_paths=[unreal.TopLevelAssetPath('/Script/Engine', 'StaticMesh')], package_paths=['/Game'], recursive_paths=True)
    meshes = [str(a.package_name) for a in AR.get_assets(flt)]
    log = [f'{len(meshes)} Static Meshes unter /Game durchsucht', f'Ziel: {OUT}', '']
    pick_file = os.path.join(HERE, 'export_props_pick.json'); forced = json.load(open(pick_file, encoding='utf-8')) if os.path.exists(pick_file) else {}
    used = set()
    for role, (keys, bad, lo, hi) in ROLES.items():
        cands = []
        for p in meshes:
            w = words(p)
            hit = [k for k in keys if k in w]
            if not hit or any(b in w for b in bad): continue
            cands.append((p, len(hit), keys.index(hit[0])))
        scored = []
        for p, nh, first in cands[:300]:
            m = unreal.load_asset(p); s = size_cm(m)
            if s < lo or s > hi: continue
            t = tris(m); scored.append(((-nh, first, t > 60000, t), p, s, t))  # mehr Treffer, früherer Begriff, nicht zu schwer
        scored.sort()
        log.append(f'[{role}] {len(scored)} Kandidaten'); log += [f'    {p}  ({s:.0f} cm, {t} Dreiecke)' for _, p, s, t in scored[:8]]
        choice = forced.get(role) or next((p for _, p, _, _ in scored if p not in used), None)
        if not choice: log.append('    → nichts Passendes, übersprungen'); continue
        used.add(choice); mesh = unreal.load_asset(choice); d = os.path.join(OUT, role); os.makedirs(d, exist_ok=True)
        ok = unreal.GLTFExporter.export_to_gltf(mesh, os.path.join(d, 'model.glb'), opts(), set())
        json.dump({'source': choice, 'size_cm': size_cm(mesh), 'triangles': tris(mesh), 'ok': bool(ok)}, open(os.path.join(d, 'info.json'), 'w', encoding='utf-8'), indent=1)
        log.append(f'    → exportiert: {choice} ({"ok" if ok else "FEHLER"})')
    open(os.path.join(HERE, 'export_props_log.txt'), 'w', encoding='utf-8').write('\n'.join(log))

try:
    main()
except Exception:
    import traceback; open(os.path.join(HERE, 'export_props_log.txt'), 'w', encoding='utf-8').write(traceback.format_exc())
