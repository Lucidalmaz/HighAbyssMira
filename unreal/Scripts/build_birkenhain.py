"""Baut das Level /Game/Maps/Birkenhain in Unreal Engine 5 auf.
Aufruf (headless):  UnrealEditor-Cmd.exe HighAbyssMira.uproject -ExecutePythonScript="Scripts/build_birkenhain.py" -unattended -nosplash
Oder im Editor: Werkzeuge → Python-Skript ausführen.
Idempotent: Assets werden wiederverwendet, das Level wird neu aufgebaut.
"""
import os, math, random, unreal

HERE = os.path.dirname(os.path.abspath(__file__))
PH = os.path.join(HERE, 'polyhaven')
AT = unreal.AssetToolsHelpers.get_asset_tools()
MEL = unreal.MaterialEditingLibrary
EAL = unreal.EditorAssetLibrary
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
LES = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
random.seed(7)
LOG = []
def log(*a):
    msg = 'HAM: ' + ' '.join(str(x) for x in a); LOG.append(msg); unreal.log(msg)

# ------------------------------------------------------------------ Import
def import_file(src, dest, name=None):
    t = unreal.AssetImportTask(); t.filename = src; t.destination_path = dest; t.automated = True; t.replace_existing = True; t.save = True
    if name: t.destination_name = name
    AT.import_asset_tasks([t])
    paths = list(t.imported_object_paths)
    if not paths: log('Import FEHLGESCHLAGEN', src)
    return paths

def texture(tid, short):
    folder = os.path.join(PH, 'textures', tid)
    if not os.path.isdir(folder): return None
    f = next((x for x in os.listdir(folder) if x.startswith(f'{tid}_{short}.')), None)
    if not f: return None
    dest = f'/Game/Textures/{tid}'; asset = f'{dest}/T_{tid}_{short}'
    if EAL.does_asset_exist(asset): return unreal.load_asset(asset)
    paths = import_file(os.path.join(folder, f), dest, f'T_{tid}_{short}')
    if not paths: return None
    tex = unreal.load_asset(paths[0])
    if short == 'N':
        tex.set_editor_property('compression_settings', unreal.TextureCompressionSettings.TC_NORMALMAP); tex.set_editor_property('srgb', False); tex.set_editor_property('flip_green_channel', True)
    elif short in ('R', 'AO', 'H'):
        tex.set_editor_property('srgb', False); tex.set_editor_property('compression_settings', unreal.TextureCompressionSettings.TC_GRAYSCALE)
    EAL.save_loaded_asset(tex)
    return tex

# ------------------------------------------------------------------ Materialien
FN_TEX = unreal.load_asset('/Engine/Functions/Engine_MaterialFunctions01/Texturing/WorldAlignedTexture')
FN_NRM = unreal.load_asset('/Engine/Functions/Engine_MaterialFunctions01/Texturing/WorldAlignedNormal')

def expr(m, cls, x, y):
    return MEL.create_material_expression(m, cls, x, y)

def world_sample(m, tex, size_cm, y, normal=False):
    """Weltbezogene (triplanare) Projektion – Textur liegt überall in echter Größe."""
    to = expr(m, unreal.MaterialExpressionTextureObject, -900, y); to.set_editor_property('texture', tex)
    if normal: to.set_editor_property('sampler_type', unreal.MaterialSamplerType.SAMPLERTYPE_NORMAL)
    sz = expr(m, unreal.MaterialExpressionConstant3Vector, -900, y + 120); sz.set_editor_property('constant', unreal.LinearColor(size_cm, size_cm, size_cm, 1))
    fc = expr(m, unreal.MaterialExpressionMaterialFunctionCall, -600, y); fc.set_material_function(FN_NRM if normal else FN_TEX)
    ok1 = MEL.connect_material_expressions(to, '', fc, 'TextureObject'); ok2 = MEL.connect_material_expressions(sz, '', fc, 'TextureSize')
    if not (ok1 and ok2): log('Pin-Problem', tex.get_name(), ok1, ok2)
    return fc

def make_material(name, tid, size_cm, tint=(1, 1, 1), rough=1.0, wet=0.0, emissive=None):
    path = f'/Game/Materials/{name}'
    if EAL.does_asset_exist(path): EAL.delete_asset(path)
    m = AT.create_asset(name, '/Game/Materials', unreal.Material, unreal.MaterialFactoryNew())
    d, n, r, ao = texture(tid, 'D'), texture(tid, 'N'), texture(tid, 'R'), texture(tid, 'AO')
    if d:
        s = world_sample(m, d, size_cm, -400)
        mul = expr(m, unreal.MaterialExpressionMultiply, -250, -400); c = expr(m, unreal.MaterialExpressionConstant3Vector, -400, -300); c.set_editor_property('constant', unreal.LinearColor(*tint, 1))
        MEL.connect_material_expressions(s, 'XYZ Texture', mul, 'A'); MEL.connect_material_expressions(c, '', mul, 'B')
        # Nässe dunkelt die Farbe ab
        if wet > 0:
            wm = expr(m, unreal.MaterialExpressionMultiply, -120, -400); wc = expr(m, unreal.MaterialExpressionConstant, -250, -250); wc.set_editor_property('r', 1 - wet * .35)
            MEL.connect_material_expressions(mul, '', wm, 'A'); MEL.connect_material_expressions(wc, '', wm, 'B'); mul = wm
        MEL.connect_material_property(mul, '', unreal.MaterialProperty.MP_BASE_COLOR)
    if n:
        s = world_sample(m, n, size_cm, 0, normal=True); MEL.connect_material_property(s, 'XYZ Texture', unreal.MaterialProperty.MP_NORMAL)
    if r:
        s = world_sample(m, r, size_cm, 400)
        mr = expr(m, unreal.MaterialExpressionMultiply, -250, 400); k = expr(m, unreal.MaterialExpressionConstant, -400, 520); k.set_editor_property('r', rough * (1 - wet * .55))
        MEL.connect_material_expressions(s, 'XYZ Texture', mr, 'A'); MEL.connect_material_expressions(k, '', mr, 'B')
        if wet > 0:  # Pfützen: großflächiges Rauschen senkt die Rauheit stellenweise auf fast null
            nz = expr(m, unreal.MaterialExpressionNoise, -700, 700); nz.set_editor_property('scale', .0022); nz.set_editor_property('levels', 3); nz.set_editor_property('output_min', -.6); nz.set_editor_property('output_max', 1.4)
            sat = expr(m, unreal.MaterialExpressionSaturate, -500, 700); MEL.connect_material_expressions(nz, '', sat, '')
            lp = expr(m, unreal.MaterialExpressionLinearInterpolate, -100, 500); lo = expr(m, unreal.MaterialExpressionConstant, -250, 650); lo.set_editor_property('r', .04)
            MEL.connect_material_expressions(mr, '', lp, 'A'); MEL.connect_material_expressions(lo, '', lp, 'B'); MEL.connect_material_expressions(sat, '', lp, 'Alpha'); mr = lp
        MEL.connect_material_property(mr, '', unreal.MaterialProperty.MP_ROUGHNESS)
    if ao:
        s = world_sample(m, ao, size_cm, 800); MEL.connect_material_property(s, 'XYZ Texture', unreal.MaterialProperty.MP_AMBIENT_OCCLUSION)
    MEL.recompile_material(m); EAL.save_loaded_asset(m)
    log('Material', name, 'D' if d else '-', 'N' if n else '-', 'R' if r else '-', 'AO' if ao else '-')
    return m

def simple_material(name, color, rough=.5, metal=0., emissive=None, emissive_strength=0., two_sided=False, unlit=False, opacity=None):
    path = f'/Game/Materials/{name}'
    if EAL.does_asset_exist(path): EAL.delete_asset(path)
    m = AT.create_asset(name, '/Game/Materials', unreal.Material, unreal.MaterialFactoryNew())
    if two_sided: m.set_editor_property('two_sided', True)
    if unlit: m.set_editor_property('shading_model', unreal.MaterialShadingModel.MSM_UNLIT)
    c = expr(m, unreal.MaterialExpressionConstant3Vector, -400, 0); c.set_editor_property('constant', unreal.LinearColor(*color, 1))
    if not unlit: MEL.connect_material_property(c, '', unreal.MaterialProperty.MP_BASE_COLOR)
    r = expr(m, unreal.MaterialExpressionConstant, -400, 150); r.set_editor_property('r', rough); MEL.connect_material_property(r, '', unreal.MaterialProperty.MP_ROUGHNESS)
    mt = expr(m, unreal.MaterialExpressionConstant, -400, 250); mt.set_editor_property('r', metal); MEL.connect_material_property(mt, '', unreal.MaterialProperty.MP_METALLIC)
    if emissive:
        e = expr(m, unreal.MaterialExpressionConstant3Vector, -400, 350); e.set_editor_property('constant', unreal.LinearColor(*[v * emissive_strength for v in emissive], 1))
        MEL.connect_material_property(e, '', unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    MEL.recompile_material(m); EAL.save_loaded_asset(m); return m

def mat_instance_tint(base, name, tint):
    return base  # Platzhalter – Farbvarianten folgen über eigene Materialien

# ------------------------------------------------------------------ Modelle
def model(mid):
    folder = os.path.join(PH, 'models', mid)
    if not os.path.isdir(folder): return None
    dest = f'/Game/Props/{mid}'
    existing = [a for a in EAL.list_assets(dest, recursive=True, include_folder=False) if unreal.EditorAssetLibrary.find_asset_data(a).asset_class_path.asset_name == 'StaticMesh'] if EAL.does_directory_exist(dest) else []
    if not existing:
        gl = next((x for x in os.listdir(folder) if x.endswith('.gltf')), None)
        if not gl: return None
        import_file(os.path.join(folder, gl), dest)
        existing = [a for a in EAL.list_assets(dest, recursive=True, include_folder=False) if unreal.EditorAssetLibrary.find_asset_data(a).asset_class_path.asset_name == 'StaticMesh']
    meshes = [unreal.load_asset(a) for a in existing]
    log('Modell', mid, len(meshes), 'Mesh(es)')
    return meshes

# ------------------------------------------------------------------ Level
CUBE = unreal.load_asset('/Engine/BasicShapes/Cube')
PLANE = unreal.load_asset('/Engine/BasicShapes/Plane')
CYL = unreal.load_asset('/Engine/BasicShapes/Cylinder')
SPHERE = unreal.load_asset('/Engine/BasicShapes/Sphere')
M = 100.0  # Meter → Zentimeter

def rot(yaw=0., pitch=0., roll=0.): return unreal.Rotator(roll=roll, pitch=pitch, yaw=yaw)

def place(mesh, loc, size=None, scale=None, yaw=0., pitch=0., roll=0., mat=None, label=None, folder=None, shadows=True, collide=True):
    a = EAS.spawn_actor_from_object(mesh, unreal.Vector(*loc), rot(yaw, pitch, roll))
    if size: a.set_actor_scale3d(unreal.Vector(size[0] / 100., size[1] / 100., size[2] / 100.))
    elif scale: a.set_actor_scale3d(unreal.Vector(*scale))
    smc = a.static_mesh_component
    if mat:
        for i in range(max(1, smc.get_num_materials())): smc.set_material(i, mat)
    smc.set_editor_property('cast_shadow', shadows)
    if not collide: smc.set_collision_profile_name('NoCollision')
    if label: a.set_actor_label(label)
    if folder: a.set_folder_path(folder)
    return a

def box(cx, cy, z0, sx, sy, sz, mat, **kw):
    """Quader in Metern: Mittelpunkt (cx, cy), Unterkante z0, Größe sx×sy×sz."""
    return place(CUBE, (cx * M, cy * M, (z0 + sz / 2) * M), size=(sx * M, sy * M, sz * M), mat=mat, **kw)

def light(cls, loc, rotation=None, **props):
    a = EAS.spawn_actor_from_class(cls, unreal.Vector(*loc), rotation or rot())
    comp = a.get_component_by_class(unreal.LightComponent) or a.light_component
    for k, v in props.items():
        try: comp.set_editor_property(k, v)
        except Exception as e: log('Licht-Eigenschaft', k, e)
    return a, comp

def build():
    log('Start')
    for d in ('/Game/Materials', '/Game/Textures', '/Game/Props', '/Game/Maps'):
        if not EAL.does_directory_exist(d): EAL.make_directory(d)
    # --- Materialien
    MT = {
        'road': make_material('M_Road', 'asphalt_02', 400, tint=(.85, .85, .9), rough=.9, wet=.7),
        'walk': make_material('M_Sidewalk', 'pavement_02', 250, rough=.95, wet=.45),
        'lawn': make_material('M_Lawn', 'leaves_forest_ground', 300, tint=(.9, .85, .8), rough=1., wet=.2),
        'grass': make_material('M_Grass', 'leafy_grass', 250, tint=(.55, .65, .5), rough=1., wet=.2),
        'siding': make_material('M_Siding', 'weathered_plank_siding', 250, tint=(.75, .78, .8), rough=.9, wet=.15),
        'siding2': make_material('M_Siding2', 'exterior_wall_cladding_02', 250, tint=(.7, .66, .6), rough=.9, wet=.15),
        'roof': make_material('M_Roof', 'grey_roof_tiles_02', 250, tint=(.55, .55, .58), rough=.85, wet=.4),
        'roof2': make_material('M_Roof2', 'roof_slates_03', 250, tint=(.6, .6, .62), rough=.8, wet=.4),
        'brick': make_material('M_Brick', 'red_brick_03', 180, tint=(.8, .75, .72), rough=.9, wet=.2),
        'bark': make_material('M_Bark', 'bark_brown_02', 150, tint=(.5, .45, .42), rough=.95),
        'plaster': make_material('M_Plaster', 'painted_plaster_wall', 200, tint=(.65, .6, .5), rough=.9),
        'floor': make_material('M_WoodFloor', 'weathered_brown_planks', 200, rough=.7),
        'concrete': make_material('M_Concrete', 'concrete_wall_003', 300, tint=(.7, .7, .7), rough=.9),
        'rust': make_material('M_Rust', 'rusty_metal_02', 150, rough=.7),
        'burnt': make_material('M_Burnt', 'burned_ground_01', 300, rough=1.),
    }
    MT['paint'] = simple_material('M_WhitePaint', (.72, .7, .64), rough=.55)
    MT['dark'] = simple_material('M_DarkWood', (.05, .035, .025), rough=.6)
    MT['glass'] = simple_material('M_DarkGlass', (.01, .012, .016), rough=.03, metal=.1)
    MT['winlit'] = simple_material('M_WindowLit', (0, 0, 0), rough=.3, emissive=(1., .55, .22), emissive_strength=6.)
    MT['bulb'] = simple_material('M_LampBulb', (0, 0, 0), rough=.3, emissive=(1., .72, .42), emissive_strength=40.)
    MT['line'] = simple_material('M_RoadLine', (.55, .52, .44), rough=.6)
    MT['metal'] = simple_material('M_DarkMetal', (.05, .05, .055), rough=.4, metal=.9)
    # --- Modelle
    MD = {k: model(k) for k in ['street_lamp_01', 'street_lamp_02', 'modular_electricity_poles', 'fire_hydrant', 'water_manhole_cover', 'metal_trash_can',
                                 'trashbag', 'old_tyre', 'covered_car', 'wooden_crate_01', 'Barrel_01', 'tree_small_02', 'fir_tree_01', 'rock_moss_set_01', 'shrub_sorrel_01']}

    # --- Neues Level
    if not LES.new_level('/Game/Maps/Birkenhain'):
        raise RuntimeError('Karte /Game/Maps/Birkenhain ließ sich nicht anlegen (Datei vorher löschen). Abbruch.')
    # Boden & Straßen
    box(0, 0, -.5, 320, 320, .5, MT['lawn'], label='Boden', folder='Welt', shadows=False)
    box(0, 0, 0, 156, 8, .04, MT['road'], label='Hauptstraße', folder='Welt', shadows=False)
    box(0, -25, 0, 8, 42, .04, MT['road'], label='Querstraße', folder='Welt', shadows=False)
    for x in range(-74, 75, 6):
        if abs(x) > 6: box(x, 0, .04, 2.6, .14, .005, MT['line'], folder='Welt/Markierung', shadows=False, collide=False)
    for s in (-1, 1):
        for a, b in ((-78, -4), (4, 78)):
            box((a + b) / 2, s * 5, 0, b - a, 2, .14, MT['walk'], folder='Welt/Gehweg', shadows=False)
            box((a + b) / 2, s * 4.05, 0, b - a, .18, .17, MT['walk'], folder='Welt/Bordstein')
        box(s * 5, -26, 0, 2, 40, .14, MT['walk'], folder='Welt/Gehweg', shadows=False)
    # Häuser (wie im Browser-Spiel)
    HOUSES = [(-50, -17, 1, 12, 10, 3.2, 'siding', 'roof'), (-28, -17, 1, 10, 9, 6, 'siding2', 'roof2'), (26, -17, 1, 12, 10, 3.2, 'siding', 'roof'), (50, -17, 1, 11, 9, 6, 'siding', 'roof2'),
              (-50, 17, -1, 11, 9, 6, 'brick', 'roof'), (-28, 17, -1, 10, 9, 6, 'siding2', 'roof'), (22, 17, -1, 11, 9, 3.4, 'siding', 'roof2'), (46, 17, -1, 10, 9, 6, 'brick', 'roof')]
    for i, (hx, hz, f, w, d, H, wm, rm) in enumerate(HOUSES):
        house(i, hx, hz, f, w, d, H, MT[wm], MT[rm], MT, lit=(i in (1, 2, 3, 5, 7)))
    # Laternen (echte Modelle) + Licht
    lamp_mesh = (MD.get('street_lamp_02') or MD.get('street_lamp_01') or [None])[0]
    for i, (lx, s) in enumerate([(-60, 1), (-40, -1), (-20, 1), (20, 1), (40, -1), (60, 1), (69, 1)]):
        street_lamp(lx, s * 6.3, -s, lamp_mesh, MT, flicker=(i in (1, 4, 6)))
    # Strommasten
    pole = (MD.get('modular_electricity_poles') or [None])[0]
    if pole:
        for x in range(-76, 77, 19): place(pole, (x * M, 7.6 * M, 0), yaw=90, folder='Welt/Strom')
    # Bäume, Büsche, Steine
    trees = [m for k in ('tree_small_02', 'fir_tree_01') for m in (MD.get(k) or [])]
    for x in range(-74, 76, 7):
        for z0 in (-28.5, 28.5):
            if trees: place(random.choice(trees), ((x + random.uniform(-1.5, 1.5)) * M, (z0 + random.uniform(-2, 2)) * M, 0), yaw=random.uniform(0, 360), scale=(random.uniform(.9, 1.4),) * 3, folder='Welt/Bäume')
    for m_, n_ in (('shrub_sorrel_01', 40), ('rock_moss_set_01', 14)):
        for mesh in (MD.get(m_) or [])[:1]:
            for _ in range(n_):
                x, z = random.uniform(-72, 72), random.choice([-1, 1]) * random.uniform(8, 26)
                if any(abs(x - h[0]) < h[3] / 2 + 1 and abs(z - h[1]) < h[4] / 2 + 1 for h in HOUSES): continue
                place(mesh, (x * M, z * M, 0), yaw=random.uniform(0, 360), scale=(random.uniform(.8, 1.6),) * 3, folder='Welt/Pflanzen', collide=False)
    # Straßenmöbel
    def put(key, x, z, yaw=0., sc=1.):
        for mesh in (MD.get(key) or [])[:1]: place(mesh, (x * M, z * M, 0), yaw=yaw, scale=(sc,) * 3, folder='Welt/Details')
    put('fire_hydrant', -44, 6.4); put('fire_hydrant', 32, -6.4, 180)
    for x in (-30, 12, 44): put('water_manhole_cover', x, 1.8)
    for x, z in ((-52.5, 6.6), (-25, 6.6), (19, -6.6), (48, -6.6)): put('metal_trash_can', x, z, random.uniform(0, 360))
    put('trashbag', -51.6, 6.8, 30); put('trashbag', 47.2, -6.9, 200); put('old_tyre', -13, -15, 20)
    put('covered_car', -37, 3.1, 0); put('covered_car', 36.5, -3.1, 180)
    put('wooden_crate_01', -12, -19, 15); put('Barrel_01', -15.5, -20.5)
    # Abgebranntes Haus Nr. 5
    box(-13, -17.5, 0, 9, 8, .06, MT['burnt'], folder='Nr5', shadows=False)
    for bx, bz, sx, sz, h in ((-17, -18, .3, 5, 2.5), (-15, -21.4, 4, .3, 1.2)): box(bx, bz, 0, sx, sz, h, MT['dark'], folder='Nr5')
    box(-9.5, -20, 0, .9, .9, 4.4, MT['brick'], folder='Nr5')
    atmosphere(MT)
    log('Level fertig')
    LES.save_current_level()
    unreal.EditorLoadingAndSavingUtils.save_dirty_packages(True, True)

def house(i, hx, hz, f, w, d, H, wall, roofm, MT, lit=False):
    fld = f'Häuser/Haus_{i}'
    box(hx, hz, 0, w + .14, d + .14, .45, MT['concrete'], folder=fld)
    box(hx, hz, .45, w, d, H - .45, wall, folder=fld)
    # Satteldach 45°: zwei Dachflächen + Giebeldreiecke (auf der Spitze stehender Würfel)
    rh = w / 2; L = (w / 2 + .45) / math.cos(math.radians(45))
    for s in (-1, 1):
        cx = hx + s * (w / 4 + .1); cz = H + rh / 2 + .02
        a = place(CUBE, (cx * M, hz * M, cz * M), size=(L * M, (d + .9) * M, .16 * M), mat=roofm, folder=fld)
        a.set_actor_rotation(unreal.Rotator(roll=0, pitch=45 * s, yaw=0), False)
    g = w / math.sqrt(2)
    a = place(CUBE, (hx * M, hz * M, H * M), size=(g * M, (d - .02) * M, g * M), mat=wall, folder=fld); a.set_actor_rotation(unreal.Rotator(roll=0, pitch=45, yaw=0), False)
    box(hx, hz, H + rh - .05, .22, d + 1, .22, MT['dark'], folder=fld)
    # Tür, Fenster
    fz = hz + f * (d / 2 + .03)
    box(hx + (-1.5 if w > 11 else 0), fz, .45, 1.1, .08, 2.15, MT['dark'], folder=fld)
    rows = [1.9, 4.5] if H > 5 else [1.9]
    for y in rows:
        for k, wx in enumerate((-w * .3, w * .3)):
            glow = lit and (k + int(y > 3)) % 2 == 0
            box(hx + wx, fz, y - .65, 1.15, .06, 1.3, MT['winlit'] if glow else MT['glass'], folder=fld, shadows=False)
            box(hx + wx, fz + f * .03, y - .74, 1.4, .16, .08, MT['paint'], folder=fld)
            for dx in (-.62, .62): box(hx + wx + dx, fz + f * .02, y - .65, .1, .08, 1.3, MT['paint'], folder=fld)
            box(hx + wx, fz + f * .02, y + .65, 1.35, .08, .1, MT['paint'], folder=fld)
            if glow:
                l, c = light(unreal.PointLight, ((hx + wx) * M, (fz - f * .8) * M, y * M), intensity=18., attenuation_radius=520., light_color=unreal.Color(255, 160, 80, 255), cast_shadows=False)
                l.set_folder_path(fld)

def street_lamp(x, z, side, mesh, MT, flicker=False):
    fld = 'Welt/Laternen'
    if mesh:
        a = place(mesh, (x * M, z * M, 0), yaw=90 if side > 0 else -90, folder=fld)
        top = a.get_actor_bounds(False)[1].z * 2 / M
    else:
        place(CYL, (x * M, z * M, 270), size=(14, 14, 540), mat=MT['metal'], folder=fld); top = 5.4
    hx, hz = x, z + side * 1.6
    head_h = max(4.5, min(7.5, top - .3))
    place(SPHERE, (hx * M, hz * M, head_h * M), size=(22, 22, 10), mat=MT['bulb'], folder=fld, shadows=False, collide=False)
    a, c = light(unreal.SpotLight, (hx * M, hz * M, (head_h - .1) * M), rotation=rot(pitch=-90), intensity=85., attenuation_radius=2600., outer_cone_angle=62., inner_cone_angle=22.,
                 light_color=unreal.Color(255, 176, 106, 255), source_radius=12., volumetric_scattering_intensity=3.5, cast_shadows=True)
    a.set_folder_path(fld)
    if flicker: a.set_actor_label('Laterne_Flackern')

def atmosphere(MT):
    # Mond
    moon, c = light(unreal.DirectionalLight, (0, 0, 5000), rotation=rot(yaw=-35, pitch=-38), intensity=.35, light_color=unreal.Color(150, 170, 255, 255), cast_shadows=True, volumetric_scattering_intensity=1.5)
    for k, v in (('atmosphere_sun_light', True), ('light_source_angle', .6), ('source_angle', .6)):
        try: c.set_editor_property(k, v)
        except Exception: pass
    moon.set_actor_label('Mond'); moon.set_folder_path('Licht')
    sky = EAS.spawn_actor_from_class(unreal.SkyAtmosphere, unreal.Vector(0, 0, 0)); sky.set_folder_path('Licht')
    sl = EAS.spawn_actor_from_class(unreal.SkyLight, unreal.Vector(0, 0, 500)); slc = sl.get_component_by_class(unreal.SkyLightComponent)
    slc.set_editor_property('real_time_capture', True); slc.set_editor_property('intensity', .35); slc.set_editor_property('light_color', unreal.Color(130, 150, 210, 255)); sl.set_folder_path('Licht')
    fog = EAS.spawn_actor_from_class(unreal.ExponentialHeightFog, unreal.Vector(0, 0, -100)); fc = fog.get_component_by_class(unreal.ExponentialHeightFogComponent)
    for k, v in dict(fog_density=.06, fog_height_falloff=.35, fog_inscattering_luminance=unreal.LinearColor(.012, .016, .03, 1), enable_volumetric_fog=True, volumetric_fog_scattering_distribution=.55,
                     volumetric_fog_albedo=unreal.Color(200, 205, 220, 255), volumetric_fog_extinction_scale=1.6, volumetric_fog_distance=6000., start_distance=200.).items():
        try: fc.set_editor_property(k, v)
        except Exception as e: log('Nebel', k, e)
    fog.set_folder_path('Licht')
    try:
        cl = EAS.spawn_actor_from_class(unreal.VolumetricCloud, unreal.Vector(0, 0, 0)); cl.set_folder_path('Licht')
    except Exception as e: log('Wolken', e)
    # Nachbearbeitung wie im Kino
    pp = EAS.spawn_actor_from_class(unreal.PostProcessVolume, unreal.Vector(0, 0, 0)); pp.set_editor_property('unbound', True); pp.set_folder_path('Licht')
    s = pp.settings
    def ov(name, value):
        try: s.set_editor_property('override_' + name, True); s.set_editor_property(name, value)
        except Exception as e: log('PP', name, e)
    ov('auto_exposure_method', unreal.AutoExposureMethod.AEM_MANUAL); ov('auto_exposure_apply_physical_camera_exposure', False); ov('auto_exposure_bias', 1.6)
    ov('bloom_intensity', .9); ov('bloom_threshold', 1.)
    ov('vignette_intensity', .75); ov('film_grain_intensity', .22); ov('film_grain_intensity_shadows', .35)
    ov('scene_fringe_intensity', .6)
    ov('color_saturation', unreal.Vector4(.82, .85, .95, 1)); ov('color_contrast', unreal.Vector4(1.12, 1.12, 1.12, 1))
    ov('color_gain_shadows', unreal.Vector4(.85, .95, 1.12, 1)); ov('color_gain_highlights', unreal.Vector4(1.08, 1., .9, 1))
    ov('motion_blur_amount', .3); ov('motion_blur_max', 3.); ov('motion_blur_target_fps', 0)  # Unschärfe passend zur echten Bildrate
    # Lumen-Qualität bleibt auf Standard (1.0): höhere Stufen nur über die Grafikoptionen, sonst schwanken die Frametimes
    pp.settings = s
    # Startpunkt am Ortsschild, Blick die Straße hinunter
    ps = EAS.spawn_actor_from_class(unreal.PlayerStart, unreal.Vector(-66 * M, 2 * M, 100), rot(yaw=0)); ps.set_folder_path('Spiel')

try:
    build()
except Exception as e:
    import traceback; log('FEHLER', e); log(traceback.format_exc())
finally:
    with open(os.path.join(HERE, 'build_log.txt'), 'w', encoding='utf-8') as fh: fh.write('\n'.join(LOG))
