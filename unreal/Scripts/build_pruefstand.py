"""Prüfstand: jedes Objekt einzeln, vollständig zusammengesetzt, bei neutralem Licht.
Schreibt Saved/Pruefstand/manifest.json (Name, Quelle, Mittelpunkt, Radius) für die Kontrollbilder."""
import os, sys, json, math, unreal
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ham_mat as HM, ham_geo as HG

EAL = unreal.EditorAssetLibrary; EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem); LES = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
SMS = unreal.get_editor_subsystem(unreal.StaticMeshEditorSubsystem)
OUT = os.path.join(os.path.abspath(unreal.Paths.project_saved_dir()), 'Pruefstand'); os.makedirs(OUT, exist_ok=True)
log = HM.log
MANIFEST = []
CURSOR = [0.]

def rot(yaw=0., pitch=0., roll=0.): return unreal.Rotator(roll=roll, pitch=pitch, yaw=yaw)

def place_mesh(mesh, loc, yaw=0., mat=None, scale=1.):
    a = EAS.spawn_actor_from_object(mesh, unreal.Vector(*loc), rot(yaw)); a.set_actor_scale3d(unreal.Vector(scale, scale, scale))
    if mat:
        smc = a.static_mesh_component
        for i in range(max(1, smc.get_num_materials())): smc.set_material(i, mat)
    return a

def static_meshes(folder):
    if not EAL.does_directory_exist(folder): return []
    out = []
    for p in EAL.list_assets(folder, recursive=True, include_folder=False):
        d = EAL.find_asset_data(p)
        if d.asset_class_path.asset_name == 'StaticMesh': out.append(unreal.load_asset(p))
    return out

def mesh_box(m):
    b = m.get_bounding_box(); return [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z]

def clusters(meshes, margin=3.):
    """Teile, deren Grundrisse sich überlappen, gehören zum selben Objekt (Varianten liegen nebeneinander)."""
    boxes = [mesh_box(m) for m in meshes]; parent = list(range(len(meshes)))
    def f(i):
        while parent[i] != i: parent[i] = parent[parent[i]]; i = parent[i]
        return i
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            a, b = boxes[i], boxes[j]
            if a[0] - margin < b[3] and b[0] - margin < a[3] and a[1] - margin < b[4] and b[1] - margin < a[4]: parent[f(i)] = f(j)
    groups = {}
    for i in range(len(meshes)): groups.setdefault(f(i), []).append(i)
    res = []
    for idx in groups.values():
        bb = [min(boxes[i][0] for i in idx), min(boxes[i][1] for i in idx), min(boxes[i][2] for i in idx), max(boxes[i][3] for i in idx), max(boxes[i][4] for i in idx), max(boxes[i][5] for i in idx)]
        res.append(([meshes[i] for i in idx], bb))
    return sorted(res, key=lambda r: -((r[1][3] - r[1][0]) * (r[1][4] - r[1][1]) * (r[1][5] - r[1][2])))

def next_slot(size):
    x = CURSOR[0] + size / 2 + 400; CURSOR[0] = x + size / 2 + 400; return x

def add_entry(name, source, category, center, radius, note=''):
    MANIFEST.append(dict(name=name, source=source, category=category, center=center, radius=radius, note=note))

def ensure_import(mid):
    folder = os.path.join(HM.PH, 'models', mid)
    if not os.path.isdir(folder): return
    gl = next((x for x in os.listdir(folder) if x.endswith('.gltf')), None)
    # glTF mit nachgerüsteter Transparenz (fix_polyhaven_alpha.py): einmalig sauber neu importieren
    stamp = os.path.join(folder, '.ue_alpha_fixed')
    if gl and os.path.exists(os.path.join(folder, gl + '.orig')) and not os.path.exists(stamp):
        if EAL.does_directory_exist(f'/Game/Props/{mid}'): EAL.delete_directory(f'/Game/Props/{mid}')
        if HM.import_file(os.path.join(folder, gl), f'/Game/Props/{mid}'): open(stamp, 'w').close()
        return
    if static_meshes(f'/Game/Props/{mid}'): return
    if gl: HM.import_file(os.path.join(folder, gl), f'/Game/Props/{mid}')

def blend_mode(mi):
    try:
        o = mi.get_editor_property('base_property_overrides')
        if o.get_editor_property('override_blend_mode'): return o.get_editor_property('blend_mode')
    except Exception: pass
    try: return mi.get_base_material().get_editor_property('blend_mode')
    except Exception: return None

def nanite_safe(folder):
    """Nanite zeichnet keine durchsichtigen Materialien (Glas). Solche Meshes laufen ohne Nanite."""
    see_through = (unreal.BlendMode.BLEND_TRANSLUCENT, unreal.BlendMode.BLEND_ADDITIVE, unreal.BlendMode.BLEND_MODULATE)
    for m in static_meshes(folder):
        mats = [sm.get_editor_property('material_interface') for sm in m.get_editor_property('static_materials')]
        if not any(mi and (blend_mode(mi) in see_through or 'glass' in mi.get_name().lower()) for mi in mats): continue
        ns = m.get_editor_property('nanite_settings')
        if ns.get_editor_property('enabled'):
            ns.set_editor_property('enabled', False); SMS.set_nanite_settings(m, ns, apply_changes=True); EAL.save_loaded_asset(m)
            log('Nanite aus (Glas/Transparenz)', m.get_name())

def show_model(mid, category, max_variants=3):
    ensure_import(mid)
    nanite_safe(f'/Game/Props/{mid}')
    ms = static_meshes(f'/Game/Props/{mid}')
    if not ms: log('fehlt', mid); return
    cl = clusters(ms)
    if len(cl) > 12:  # Baukasten (z. B. Strommasten): nur die größten Stücke zeigen
        cl = cl[:4]
    for k, (parts, bb) in enumerate(cl[:max_variants]):
        sx, sy, sz = bb[3] - bb[0], bb[4] - bb[1], bb[5] - bb[2]
        cx, cy = (bb[0] + bb[3]) / 2, (bb[1] + bb[4]) / 2
        x = next_slot(max(sx, sy, 50))
        for p in parts: place_mesh(p, (x - cx, -cy, -bb[2]))
        r = math.sqrt(sx * sx + sy * sy + sz * sz) / 2
        label = mid + (f'_v{k + 1}' if len(cl) > 1 else '')
        add_entry(label, 'polyhaven', category, [x, 0, sz / 2], r, f'{len(parts)} Teile: ' + ', '.join(p.get_name() for p in parts[:6]))
        log('Prüfstand', label, len(parts), 'Teile', f'{sx:.0f}x{sy:.0f}x{sz:.0f} cm')

def show_generated(name, mesh, category, mat, note=''):
    b = mesh_box(mesh); sx, sy, sz = b[3] - b[0], b[4] - b[1], b[5] - b[2]
    x = next_slot(max(sx, sy, 50)); cx, cy = (b[0] + b[3]) / 2, (b[1] + b[4]) / 2
    place_mesh(mesh, (x - cx, -cy, -b[2]), mat=mat)
    add_entry(name, 'eigenbau', category, [x, 0, sz / 2], math.sqrt(sx * sx + sy * sy + sz * sz) / 2, note)

def build():
    if not LES.new_level('/Game/Maps/Pruefstand'):
        raise RuntimeError('Karte /Game/Maps/Pruefstand ließ sich nicht anlegen (Datei vorher löschen). Abbruch, damit nichts in eine andere Karte gebaut wird.')
    # Neutrales Tageslicht, damit Form und Material ehrlich zu sehen sind
    sun = EAS.spawn_actor_from_class(unreal.DirectionalLight, unreal.Vector(0, 0, 1000), rot(-135, -38)); sun.light_component.set_editor_property('intensity', 8.)
    try: sun.light_component.set_editor_property('atmosphere_sun_light', True)
    except Exception: pass
    EAS.spawn_actor_from_class(unreal.SkyAtmosphere, unreal.Vector(0, 0, 0))
    sl = EAS.spawn_actor_from_class(unreal.SkyLight, unreal.Vector(0, 0, 300)); sl.get_component_by_class(unreal.SkyLightComponent).set_editor_property('real_time_capture', True)
    floor = HM.plain('M_PS_Floor', (.32, .32, .31), rough=.85)
    # --- Poly-Haven-Modelle
    groups = {'Straße': ['street_lamp_01', 'street_lamp_02', 'modular_electricity_poles', 'fire_hydrant', 'water_manhole_cover', 'metal_trash_can', 'trashbag', 'old_tyre', 'covered_car', 'concrete_road_barrier', 'utility_box_01', 'painted_wooden_bench', 'industrial_wall_lamp', 'Lantern_01'],
              'Garten/Hof': ['wooden_crate_01', 'Barrel_01', 'cardboard_box_01', 'dirty_football', 'wooden_ladder', 'garden_hose_wall_mounted_01', 'modular_chainlink_fence'],
              'Pflanzen': ['tree_small_02', 'fir_tree_01', 'pine_tree_01', 'dead_tree_trunk_02', 'dry_branches_medium_01', 'fir_sapling_medium', 'pine_sapling_medium', 'shrub_sorrel_01', 'grass_medium_01', 'fern_02', 'weed_plant_02', 'nettle_plant', 'rock_moss_set_01', 'rock_moss_set_02', 'boulder_01'],
              'Innen': ['GothicBed_01', 'old_bed_frame', 'Sofa_01', 'wooden_table_02', 'GothicCabinet_01', 'painted_wooden_nightstand'], 'Tiere': ['street_rat']}
    for cat, mids in groups.items():
        for mid in mids:
            try: show_model(mid, cat)
            except Exception as e: log('Fehler Modell', mid, e)
    # --- Eigenbauten (ohne Bewegungsmaterial, damit die Form sichtbar ist)
    M = {'crow': HM.plain('M_PS_Crow', (.018, .018, .022), rough=.35), 'rat': HM.plain('M_PS_Rat', (.07, .06, .05), rough=.8), 'spider': HM.plain('M_PS_Spider', (.03, .025, .02), rough=.5),
         'web': HM.plain('M_PS_Web', (.85, .85, .8), rough=.4, opacity=.35, two_sided=True), 'moth': HM.plain('M_PS_Moth', (.55, .5, .4), rough=.9, two_sided=True),
         'figure': HM.plain('M_PS_Figure', (.03, .03, .035), rough=.9), 'fence': HM.scan_material('M_PS_Fence', 'weathered_plank_siding', 150, tint=(1.1, 1.08, 1.02), rough=.9),
         'mailbox': HM.plain('M_PS_Mailbox', (.08, .12, .09), rough=.5, metal=.6)}
    gen = [('eigen_kraehe_sitzend', lambda: HG.crow('/Game/Gen/SM_CrowPerch'), 'Tiere', 'crow'), ('eigen_kraehe_fliegend', lambda: HG.crow('/Game/Gen/SM_CrowFly', spread=True), 'Tiere', 'crow'),
           ('eigen_ratte', lambda: HG.rat('/Game/Gen/SM_Rat'), 'Tiere', 'rat'), ('eigen_spinne', lambda: HG.spider('/Game/Gen/SM_Spider', 1.6), 'Tiere', 'spider'),
           ('eigen_spinnennetz', lambda: HG.cobweb('/Game/Gen/SM_Cobweb'), 'Tiere', 'web'), ('eigen_motten', lambda: HG.moth_swarm('/Game/Gen/SM_Moths'), 'Tiere', 'moth'),
           ('eigen_gestalt', lambda: HG.figure('/Game/Gen/SM_Figure'), 'Figuren', 'figure'), ('eigen_lattenzaun', lambda: HG.picket_fence('/Game/Gen/SM_Fence6m', 600), 'Garten/Hof', 'fence'),
           ('eigen_briefkasten', lambda: HG.mailbox('/Game/Gen/SM_Mailbox'), 'Straße', 'mailbox')]
    for name, fn, cat, mk in gen:
        try:
            sm = fn()
            if sm: show_generated(name, sm, cat, M[mk])
            else: log('Eigenbau leer', name)
        except Exception as e: log('Fehler Eigenbau', name, e)
    try:
        pl = HG.power_line('/Game/Gen/SM_PowerLine', [0, 1900], 0)
        if pl: show_generated('eigen_stromleitung', pl, 'Straße', None, 'Holzmast, Isolatoren, 3 Leitungen')
    except Exception as e: log('Fehler Stromleitung', e)
    # --- Haus nach meiner bisherigen Bauweise (Dach korrigiert), zum ehrlichen Vergleich
    try:
        siding = HM.scan_material('M_PS_Siding', 'weathered_plank_siding', 250, tint=(.75, .78, .8), rough=.9)
        roofm = HM.scan_material('M_PS_Roof', 'grey_roof_tiles_02', 250, tint=(.55, .55, .58), rough=.85)
        cube = unreal.load_asset('/Engine/BasicShapes/Cube'); w, d, H = 1100., 900., 600.
        x = next_slot(1300)
        def bx(cx, cy, z0, sx, sy, sz, mat, pitch=0.):
            a = place_mesh(cube, (cx, cy, z0 + sz / 2), mat=mat); a.set_actor_scale3d(unreal.Vector(sx / 100, sy / 100, sz / 100)); a.set_actor_rotation(rot(0, pitch), False); return a
        bx(x, 0, 0, w, d, H, siding)
        rh = w / 2; L = (w / 2 + 45) / math.cos(math.radians(45))
        for s in (-1, 1): bx(x + s * (w / 4 + 10), 0, H + rh / 2 + 2 - 8, L, d + 90, 16, roofm, pitch=-45 * s)
        g = w / math.sqrt(2); a = bx(x, 0, H - g / 2, g, d - 2, g, siding); a.set_actor_rotation(rot(0, 45), False); a.set_actor_location(unreal.Vector(x, 0, H), False, False)
        add_entry('eigen_haus_bisherige_bauweise', 'eigenbau', 'Gebäude', [x, 0, (H + rh) / 2], math.sqrt(w * w + d * d + (H + rh) ** 2) / 2, 'Quader + Fotoscan-Material, Satteldach aus zwei Platten')
    except Exception as e: log('Fehler Haus', e)
    # Boden unter der ganzen Reihe und weit in die Tiefe, damit kein Objekt vor schwarzem Nichts steht
    L = CURSOR[0] + 60000
    fl = place_mesh(unreal.load_asset('/Engine/BasicShapes/Plane'), (CURSOR[0] / 2, 0, 0), mat=floor); fl.set_actor_scale3d(unreal.Vector(L / 100, 1000, 1))
    LES.save_current_level(); unreal.EditorLoadingAndSavingUtils.save_dirty_packages(True, True)
    with open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8') as fh: json.dump(MANIFEST, fh, ensure_ascii=False, indent=1)
    log('Prüfstand fertig', len(MANIFEST), 'Einträge')

try: build()
except Exception as e:
    import traceback; log('FEHLER', e); log(traceback.format_exc())
finally:
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pruefstand_log.txt'), 'w', encoding='utf-8') as fh: fh.write('\n'.join(HM.LOG))
