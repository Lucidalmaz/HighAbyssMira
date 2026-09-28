"""Exportiert die Kanalstadt (Singapore_Canal) als GLB – ohne Himmel, Nebel, Lichter – und die Lichter separat als JSON."""
import os, json, unreal
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.abspath(unreal.Paths.project_saved_dir()), 'GameExport', 'canal'); os.makedirs(OUT, exist_ok=True)
LES = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem); EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
LES.load_level('/Game/Singapore_Canal/Map/Singapore_Canal')
world = unreal.EditorLevelLibrary.get_editor_world()
acts = EAS.get_all_level_actors()
skip_cls = ('SkyLight', 'DirectionalLight', 'ExponentialHeightFog', 'PostProcessVolume', 'SphereReflectionCapture', 'PlayerStart', 'BP_Sky_Sphere_C', 'PointLight', 'SpotLight', 'RectLight', 'InstancedFoliageActor', 'AtmosphericFog')
sel = set(); lights = []; ref = None; foliage = 0
for a in acts:
    cn = a.get_class().get_name()
    if isinstance(a, unreal.Light):
        lc = a.get_component_by_class(unreal.LightComponent); l = a.get_actor_location()
        lights.append({'type': cn, 'loc': [l.x, l.y, l.z], 'color': [lc.get_editor_property('light_color').r, lc.get_editor_property('light_color').g, lc.get_editor_property('light_color').b], 'intensity': lc.get_editor_property('intensity'),
                       'radius': lc.get_editor_property('attenuation_radius') if hasattr(lc, 'attenuation_radius') else 1000})
        continue
    if cn in skip_cls: continue
    names = [c.get_editor_property('static_mesh').get_name() for c in a.get_components_by_class(unreal.StaticMeshComponent) if c.get_editor_property('static_mesh')]
    if not names or any(n in ('SM_SkySphere', 'SM_Template_Map_Floor') for n in names): continue
    sel.add(a)
    if ref is None and cn == 'StaticMeshActor': l = a.get_actor_location(); ref = {'name': a.get_actor_label(), 'loc': [l.x, l.y, l.z], 'mesh': names[0]}
o = unreal.GLTFExportOptions()
for k, v in [('export_lights', False), ('export_cameras', False), ('texture_image_format', unreal.GLTFTextureImageFormat.JPEG), ('texture_image_quality', 82),
             ('bake_material_inputs', unreal.GLTFMaterialBakeMode.USE_MESH_DATA), ('export_vertex_colors', False), ('export_uniform_scale', 1.0)]:
    try: o.set_editor_property(k, v)
    except Exception as e: unreal.log_warning(f'Option {k}: {e}')
try:
    bs = o.get_editor_property('default_material_bake_size'); bs.set_editor_property('size', unreal.GLTFMaterialBakeSize.POT_1024); o.set_editor_property('default_material_bake_size', bs)
except Exception as e: unreal.log_warning(str(e))
msgs = unreal.GLTFExporter.export_to_gltf(world, os.path.join(OUT, 'canal.glb'), o, sel)
json.dump({'lights': lights, 'ref': ref, 'selected': len(sel)}, open(os.path.join(OUT, 'canal_meta.json'), 'w'), indent=1)
open(os.path.join(HERE, 'export_log.txt'), 'w').write(f'{len(sel)} Actors, {len(lights)} Lichter\n{msgs}')
