"""Inventur und Export von Figuren für das Browserspiel.
Ohne Ziel: schreibt Scripts/export_inventory.txt (alle Skeletal Meshes mit passenden Animationen, alle neuen Ordner).
Mit Scripts/export_target.json ({"mesh": "/Game/…/SK_X", "name": "justin", "anims": ["Idle", "Walk", …]}):
exportiert je Animation eine GLB nach Saved/GameExport/<name>/ (die erste mit Mesh, die übrigen nur Skelett + Animation).
"""
import os, json, unreal

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.abspath(unreal.Paths.project_saved_dir()), 'GameExport')
EAL = unreal.EditorAssetLibrary
AR = unreal.AssetRegistryHelpers.get_asset_registry()

def assets_of(cls):
    f = unreal.ARFilter(class_paths=[unreal.TopLevelAssetPath('/Script/Engine', cls)], package_paths=['/Game'], recursive_paths=True)
    return [str(a.package_name) for a in AR.get_assets(f)]

def inventory():
    lines = ['ORDNER:'] + sorted(set('/'.join(p.split('/')[:3]) for p in EAL.list_assets('/Game', recursive=True, include_folder=False)))
    anims = {}
    for a in assets_of('AnimSequence'):
        try:
            s = unreal.load_asset(a).get_editor_property('skeleton'); anims.setdefault(s.get_path_name() if s else '?', []).append(a)
        except Exception: pass
    lines.append('\nSKELETAL MESHES:')
    for m in assets_of('SkeletalMesh'):
        if '/Characters/Mannequins/' in m: continue
        sk = unreal.load_asset(m).get_editor_property('skeleton'); key = sk.get_path_name() if sk else '?'
        lines.append(f'{m}  (Skelett {key}, {len(anims.get(key, []))} Animationen)')
        for x in anims.get(key, [])[:60]: lines.append('    ' + x)
    lines.append('\nSTATIC MESHES (neu, außerhalb Props/Gen):')
    lines += ['  ' + m for m in assets_of('StaticMesh') if not m.startswith(('/Game/Props', '/Game/Gen', '/Game/LevelPrototyping', '/Game/Characters'))][:400]
    open(os.path.join(HERE, 'export_inventory.txt'), 'w', encoding='utf-8').write('\n'.join(lines))

def export(target):
    mesh = unreal.load_asset(target['mesh']); name = target['name']
    d = os.path.join(OUT, name); os.makedirs(d, exist_ok=True)
    def opts(preview):
        o = unreal.GLTFExportOptions()
        for k, v in [('export_preview_mesh', preview), ('export_animation_sequences', True), ('export_vertex_skin_weights', True), ('export_morph_targets', False),
                     ('texture_image_format', unreal.GLTFTextureImageFormat.JPEG), ('texture_image_quality', 85), ('export_unlit_materials', False),
                     ('bake_material_inputs', unreal.GLTFMaterialBakeMode.USE_MESH_DATA), ('export_lights', False), ('export_cameras', False)]:
            try: o.set_editor_property(k, v)
            except Exception as e: unreal.log_warning(f'Option {k}: {e}')
        try:
            bs = o.get_editor_property('default_material_bake_size'); bs.set_editor_property('size', unreal.GLTFMaterialBakeSize.POT_1024); o.set_editor_property('default_material_bake_size', bs)
        except Exception as e: unreal.log_warning(f'Bake-Größe: {e}')
        return o
    report = []
    anims = target.get('anims') or []
    ok = unreal.GLTFExporter.export_to_gltf(mesh, os.path.join(d, '0_mesh.glb'), opts(True), set()); report.append(f'0_mesh.glb {ok}')
    for i, a in enumerate(anims):
        fn = os.path.join(d, f'{i + 1}_' + a.split('/')[-1] + '.glb')
        ok = unreal.GLTFExporter.export_to_gltf(unreal.load_asset(a), fn, opts(False), set()); report.append(f'{fn} {ok}')
    for sk in target.get('parts', []):
        fn = os.path.join(d, 'part_' + sk.split('/')[-1] + '.glb')
        ok = unreal.GLTFExporter.export_to_gltf(unreal.load_asset(sk), fn, opts(True), set()); report.append(f'{fn} {ok}')
    for sm in target.get('props', []):
        fn = os.path.join(d, 'prop_' + sm.split('/')[-1] + '.glb')
        ok = unreal.GLTFExporter.export_to_gltf(unreal.load_asset(sm), fn, opts(True), set()); report.append(f'{fn} {ok}')
    try: report.append('Skelett Mesh: ' + mesh.get_editor_property('skeleton').get_path_name())
    except Exception as e: report.append(str(e))
    open(os.path.join(HERE, 'export_log.txt'), 'w', encoding='utf-8').write('\n'.join(report))

tp = os.path.join(HERE, 'export_target.json')
try:
    inventory()
    if os.path.exists(tp): export(json.load(open(tp, encoding='utf-8')))
except Exception as e:
    import traceback; open(os.path.join(HERE, 'export_log.txt'), 'w', encoding='utf-8').write(traceback.format_exc())
