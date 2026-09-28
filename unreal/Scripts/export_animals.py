"""Tiere aus /Game/AnimalVarietyPack (und weitere Ordner aus export_pack_roots.json) exportieren:
je Skeletal Mesh: 0_mesh.glb (Mesh + Skelett) und je passender Animation <i>_<Name>.glb (nur Skelett + Animation)
nach Saved/GameExport/packs/<meshname>/. Protokoll: Scripts/export_animals_log.txt"""
import os, json, unreal
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.abspath(unreal.Paths.project_saved_dir()), 'GameExport', 'packs')
AR = unreal.AssetRegistryHelpers.get_asset_registry()
roots = ['/Game/AnimalVarietyPack']
rp = os.path.join(HERE, 'export_pack_roots.json')
if os.path.exists(rp): roots = json.load(open(rp, encoding='utf-8'))
log = []

def assets(cls, root):
    f = unreal.ARFilter(class_paths=[unreal.TopLevelAssetPath('/Script/Engine', cls)], package_paths=[root], recursive_paths=True)
    return [str(a.package_name) for a in AR.get_assets(f)]

def opts(preview):
    o = unreal.GLTFExportOptions()
    for k, v in [('export_preview_mesh', preview), ('export_animation_sequences', True), ('export_vertex_skin_weights', True), ('export_morph_targets', False),
                 ('texture_image_format', unreal.GLTFTextureImageFormat.JPEG), ('texture_image_quality', 88), ('export_unlit_materials', False),
                 ('bake_material_inputs', unreal.GLTFMaterialBakeMode.USE_MESH_DATA), ('export_lights', False), ('export_cameras', False)]:
        try: o.set_editor_property(k, v)
        except Exception as e: log.append(f'Option {k}: {e}')
    try:
        bs = o.get_editor_property('default_material_bake_size'); bs.set_editor_property('size', unreal.GLTFMaterialBakeSize.POT_2048); o.set_editor_property('default_material_bake_size', bs)
    except Exception as e: log.append(f'Bake: {e}')
    return o

try:
    for root in roots:
        anim_by_skel = {}
        for a in assets('AnimSequence', root):
            try:
                s = unreal.load_asset(a).get_editor_property('skeleton'); anim_by_skel.setdefault(s.get_path_name() if s else '?', []).append(a)
            except Exception as e: log.append(f'Anim {a}: {e}')
        for m in assets('SkeletalMesh', root):
            mesh = unreal.load_asset(m); name = m.split('/')[-1]
            sk = mesh.get_editor_property('skeleton'); key = sk.get_path_name() if sk else '?'
            d = os.path.join(OUT, name); os.makedirs(d, exist_ok=True)
            ok = unreal.GLTFExporter.export_to_gltf(mesh, os.path.join(d, '0_mesh.glb'), opts(True), set())
            log.append(f'{m} -> {ok}, Skelett {key}, {len(anim_by_skel.get(key, []))} Animationen')
            for i, a in enumerate(sorted(anim_by_skel.get(key, []))):
                fn = os.path.join(d, f'{i + 1}_' + a.split('/')[-1] + '.glb')
                ok = unreal.GLTFExporter.export_to_gltf(unreal.load_asset(a), fn, opts(False), set()); log.append(f'   {a.split("/")[-1]} {ok}')
        for m in assets('StaticMesh', root):
            name = m.split('/')[-1]; d = os.path.join(OUT, '_static'); os.makedirs(d, exist_ok=True)
            ok = unreal.GLTFExporter.export_to_gltf(unreal.load_asset(m), os.path.join(d, name + '.glb'), opts(True), set()); log.append(f'static {m} {ok}')
except Exception:
    import traceback; log.append(traceback.format_exc())
open(os.path.join(HERE, 'export_animals_log.txt'), 'w', encoding='utf-8').write('\n'.join(log))
