"""Importiert heruntergeladene Fab-Modelle (FBX/glTF + lose Texturen) ins Unreal-Projekt unter /Game/HAM_Import/<rolle>/,
baut aus den Texturen PBR-Materialien (BaseColor/Normal/Roughness/Metallic/AO) und schreibt die Rollen-Zuordnung
für export_props.py / export_figures.py (export_props_pick.json / export_figures_pick.json).
Quelle: Umgebungsvariable HAM_DL (Ordner mit je einem Unterordner pro Rolle), Standard C:/Users/GIGABYTE/HAM_FabDownloads/v5/x
Aufruf: UnrealEditor-Cmd.exe <Projekt> -ExecutePythonScript="<Repo>/unreal/Scripts/import_fab_downloads.py" -unattended -nosplash"""
import os, re, json, glob, unreal

HERE = os.path.dirname(os.path.abspath(__file__))
DL = os.environ.get('HAM_DL') or 'C:/Users/GIGABYTE/HAM_FabDownloads/v5/x'
FIGURES = {'kind_junge', 'kind_maedchen', 'alter_mann', 'erwachsener'}
SKIP = {'schluessel2'}
AT = unreal.AssetToolsHelpers.get_asset_tools(); MEL = unreal.MaterialEditingLibrary; EAL = unreal.EditorAssetLibrary
log = []

def kind_of(name):
    # nur das Dateiende zählt (Asset-Namen wie "Metal_Ladder" dürfen nicht als Metallkarte gelten)
    t = [x for x in re.split(r'[_\-\s.]+', name.lower()) if x and x not in ('opengl', 'directx', 'gl', 'dx', '1001', '2k', '4k', '1k', '8k')]
    last = t[-1] if t else ''; last2 = ''.join(t[-2:])
    if last in ('normal', 'nrm', 'n', 'norm'): return 'n'
    if last in ('roughness', 'rough', 'r'): return 'r'
    if last in ('metallic', 'metalness', 'metal', 'm'): return 'm'
    if last in ('ao', 'occlusion', 'ambientocclusion') or last2 == 'mixedao': return 'ao'
    if last in ('basecolor', 'albedo', 'diffuse', 'color', 'col', 'd', 'b', 'diff') or last2 in ('basecolor', 'basecol'): return 'b'
    if last in ('opacity', 'alpha', 'a'): return 'a'
    return None

def import_tex(files, dest):
    out = {}
    for f in files:
        k = kind_of(os.path.splitext(os.path.basename(f))[0])
        if not k or k in out: continue
        t = unreal.AssetImportTask(); t.filename = f; t.destination_path = dest; t.automated = True; t.replace_existing = True; t.save = True
        AT.import_asset_tasks([t])
        if t.imported_object_paths:
            tex = unreal.load_asset(t.imported_object_paths[0])
            if k in ('n',): tex.set_editor_property('compression_settings', unreal.TextureCompressionSettings.TC_NORMALMAP)
            if k in ('r', 'm', 'ao', 'a'): tex.set_editor_property('srgb', False)
            out[k] = tex
    return out

def make_material(name, dest, tex):
    mat = AT.create_asset(name, dest, unreal.Material, unreal.MaterialFactoryNew())
    y = 0
    def sample(t, prop, out='RGB'):
        nonlocal y
        e = MEL.create_material_expression(mat, unreal.MaterialExpressionTextureSample, -400, y); y += 260
        e.texture = t
        if t.get_editor_property('compression_settings') == unreal.TextureCompressionSettings.TC_NORMALMAP: e.sampler_type = unreal.MaterialSamplerType.SAMPLERTYPE_NORMAL
        elif not t.get_editor_property('srgb'): e.sampler_type = unreal.MaterialSamplerType.SAMPLERTYPE_LINEAR_COLOR
        MEL.connect_material_property(e, out, prop)
    if 'b' in tex: sample(tex['b'], unreal.MaterialProperty.MP_BASE_COLOR)
    if 'n' in tex: sample(tex['n'], unreal.MaterialProperty.MP_NORMAL)
    if 'r' in tex: sample(tex['r'], unreal.MaterialProperty.MP_ROUGHNESS, 'R')
    if 'm' in tex: sample(tex['m'], unreal.MaterialProperty.MP_METALLIC, 'R')
    if 'ao' in tex: sample(tex['ao'], unreal.MaterialProperty.MP_AMBIENT_OCCLUSION, 'R')
    MEL.recompile_material(mat); EAL.save_loaded_asset(mat)
    return mat

def main():
    props_pick, fig_pick = {}, {}
    if EAL.does_directory_exist('/Game/HAM_Import'): EAL.delete_directory('/Game/HAM_Import')  # frischer Import, keine Namenskonflikte
    for role_dir in sorted(glob.glob(os.path.join(DL, '*'))):
        role = os.path.basename(role_dir)
        if role in SKIP or not os.path.isdir(role_dir): continue
        models = [f for f in glob.glob(os.path.join(role_dir, '**', '*'), recursive=True) if f.lower().endswith(('.fbx', '.gltf', '.glb'))]
        if not models: log.append(f'[{role}] kein Modell'); continue
        src = max(models, key=os.path.getsize); dest = f'/Game/HAM_Import/{role}'
        is_fig = role in FIGURES
        t = unreal.AssetImportTask(); t.filename = src; t.destination_path = dest; t.automated = True; t.replace_existing = True; t.save = True
        if src.lower().endswith('.fbx'):
            o = unreal.FbxImportUI()
            o.set_editor_property('import_mesh', True); o.set_editor_property('import_materials', True); o.set_editor_property('import_textures', True)
            o.set_editor_property('import_as_skeletal', is_fig); o.set_editor_property('import_animations', is_fig)
            o.set_editor_property('mesh_type_to_import', unreal.FBXImportType.FBXIT_SKELETAL_MESH if is_fig else unreal.FBXImportType.FBXIT_STATIC_MESH)
            if not is_fig:
                sm = o.get_editor_property('static_mesh_import_data'); sm.set_editor_property('combine_meshes', True); sm.set_editor_property('generate_lightmap_u_vs', False)
            t.options = o
        AT.import_asset_tasks([t])
        paths = list(t.imported_object_paths or [])
        log.append(f'[{role}] {os.path.basename(src)} -> {len(paths)} Assets')
        mesh = None
        for p in paths:
            a = unreal.load_asset(p)
            if isinstance(a, (unreal.SkeletalMesh if is_fig else unreal.StaticMesh)): mesh = mesh or a
            if isinstance(a, unreal.AnimSequence):
                nm = p.split('/')[-1].split('.')[0].lower()
                if 'walk' not in nm and 'idle' not in nm and 'mixamo' not in nm:  # einzige Animation = Stehen/Ruhe → für export_figures als idle erkennbar
                    newp = p.split('.')[0] + '_idle'
                    if EAL.rename_asset(p.split('.')[0], newp): p = newp + '.' + newp.split('/')[-1]; a = unreal.load_asset(p)
                log.append(f'    Animation: {p} ({a.get_editor_property("sequence_length") if hasattr(a, "sequence_length") else ""})')
        if not mesh: log.append('    → kein Mesh importiert'); continue
        # Lose Texturen → Materialien (nur wenn es welche gibt)
        texfiles = [f for f in glob.glob(os.path.join(role_dir, '**', '*'), recursive=True) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.tga')) and '.fbm' not in f.lower()]
        if texfiles:
            try:
                mats = mesh.get_editor_property('materials' if is_fig else 'static_materials')
                for i, sm in enumerate(mats):
                    slot = str(sm.get_editor_property('material_slot_name') or f'slot{i}')
                    mine = [f for f in texfiles if slot.lower().split('_')[0] in os.path.basename(f).lower()] if len(mats) > 1 else []
                    if not mine: mine = texfiles if len(mats) == 1 else []
                    if not mine: continue
                    tex = import_tex(mine, dest + '/Tex_' + re.sub(r'\W', '_', slot))
                    if not tex: continue
                    mat = make_material('M_' + role + '_' + re.sub(r'\W', '_', slot), dest, tex)
                    sm.set_editor_property('material_interface', mat); mats[i] = sm
                    log.append(f'    Material {slot}: {sorted(tex)}')
                mesh.set_editor_property('materials' if is_fig else 'static_materials', mats)
            except Exception as e: log.append(f'    Material-Fehler: {e}')
        EAL.save_loaded_asset(mesh)
        path = mesh.get_path_name().split('.')[0]
        (fig_pick if is_fig else props_pick)[role] = path
        log.append(f'    → {path}')
    # Rollen-Zuordnung für die Export-Skripte (bestehende Einträge bleiben, neue überschreiben)
    for fn, pick in (('export_props_pick.json', props_pick), ('export_figures_pick.json', fig_pick)):
        p = os.path.join(HERE, fn); cur = json.load(open(p, encoding='utf-8')) if os.path.exists(p) else {}
        cur.update(pick); json.dump(cur, open(p, 'w', encoding='utf-8'), indent=1)
    open(os.path.join(HERE, 'import_fab_log.txt'), 'w', encoding='utf-8').write('\n'.join(log))

try:
    main()
except Exception:
    import traceback; log.append(traceback.format_exc()); open(os.path.join(HERE, 'import_fab_log.txt'), 'w', encoding='utf-8').write('\n'.join(log))
