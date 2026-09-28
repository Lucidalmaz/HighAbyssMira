"""Lädt freie CC0-Assets von Poly Haven (polyhaven.com) für High Abyss Mira.
Texturen 2K (Farbe, Normal-GL, Rauheit, AO, Höhe), HDRIs 2K, Modelle als glTF 2K.
Aufruf: python download_polyhaven.py
"""
import json, os, sys, time, urllib.request, concurrent.futures as cf

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'polyhaven')
RES = '2k'
TEXTURES = {
    'asphalt_02': 'Straße', 'pavement_02': 'Gehweg', 'leaves_forest_ground': 'Rasen mit Laub', 'leafy_grass': 'Gras',
    'weathered_plank_siding': 'Holzverkleidung', 'exterior_wall_cladding_02': 'Verkleidung 2', 'grey_roof_tiles_02': 'Dach', 'roof_slates_03': 'Dach 2',
    'red_brick_03': 'Ziegel', 'bark_brown_02': 'Rinde', 'painted_plaster_wall': 'Innenputz', 'weathered_brown_planks': 'Holzboden',
    'concrete_wall_003': 'Kellerwand', 'concrete_floor_worn_001': 'Kellerboden', 'rusty_metal_02': 'Rostmetall', 'burned_ground_01': 'Brandstelle', 'forest_leaves_02': 'Laub', 'forrest_ground_01': 'Waldboden',
}
HDRIS = ['moonlit_golf', 'kloppenheim_02']
MODELS = ['street_lamp_01', 'street_lamp_02', 'modular_electricity_poles', 'fire_hydrant', 'water_manhole_cover', 'metal_trash_can', 'trashbag',
          'old_tyre', 'covered_car', 'wooden_crate_01', 'Barrel_01', 'tree_small_02', 'fir_tree_01', 'modular_chainlink_fence',
          'GothicBed_01', 'old_bed_frame', 'Sofa_01', 'wooden_table_02', 'GothicCabinet_01', 'painted_wooden_nightstand', 'rock_moss_set_01', 'shrub_sorrel_01', 'pine_tree_01', 'dead_tree_trunk_02', 'dry_branches_medium_01', 'grass_medium_01', 'fern_02', 'fir_sapling_medium', 'pine_sapling_medium', 'concrete_road_barrier', 'utility_box_01', 'cardboard_box_01', 'painted_wooden_bench', 'industrial_wall_lamp', 'Lantern_01', 'dirty_football', 'wooden_ladder', 'garden_hose_wall_mounted_01', 'boulder_01', 'rock_moss_set_02', 'weed_plant_02', 'nettle_plant', 'street_rat']
MAPS = {'Diffuse': 'D', 'nor_gl': 'N', 'Rough': 'R', 'AO': 'AO', 'Displacement': 'H', 'arm': 'ARM'}
UA = {'User-Agent': 'HighAbyssMira-AssetFetch/1.0'}


def get_json(url):
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r: return json.load(r)
        except Exception as e:
            if i == 3: raise
            time.sleep(1.5 * (i + 1))


def fetch(url, dst):
    if os.path.exists(dst) and os.path.getsize(dst) > 0: return 0
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180) as r, open(dst + '.part', 'wb') as f:
                while True:
                    b = r.read(1 << 16)
                    if not b: break
                    f.write(b)
            os.replace(dst + '.part', dst); return os.path.getsize(dst)
        except Exception as e:
            if i == 3: print('   FEHLER', url, e); return 0
            time.sleep(2 * (i + 1))


jobs = []
for tid in TEXTURES:
    info = get_json(f'https://api.polyhaven.com/files/{tid}')
    for key, short in MAPS.items():
        if key in info and RES in info[key]:
            fmt = info[key][RES].get('png') or info[key][RES].get('jpg')
            if fmt: jobs.append((fmt['url'], os.path.join(ROOT, 'textures', tid, f'{tid}_{short}.{fmt["url"].rsplit(".", 1)[1]}')))
for hid in HDRIS:
    info = get_json(f'https://api.polyhaven.com/files/{hid}')
    jobs.append((info['hdri'][RES]['hdr']['url'], os.path.join(ROOT, 'hdri', f'{hid}_{RES}.hdr')))
for mid in MODELS:
    info = get_json(f'https://api.polyhaven.com/files/{mid}')
    g = info.get('gltf', {}).get(RES, {}).get('gltf')
    if not g: print('   kein glTF:', mid); continue
    base = os.path.join(ROOT, 'models', mid)
    jobs.append((g['url'], os.path.join(base, g['url'].rsplit('/', 1)[1])))
    for rel, inc in g.get('include', {}).items(): jobs.append((inc['url'], os.path.join(base, rel.replace('/', os.sep))))

print(f'{len(jobs)} Dateien werden geladen ...'); sys.stdout.flush()
total = 0
with cf.ThreadPoolExecutor(6) as ex:
    for n in ex.map(lambda j: fetch(*j), jobs): total += n or 0
print(f'fertig: {total / 1e6:.0f} MB neu geladen nach {ROOT}')
with open(os.path.join(ROOT, 'QUELLEN.txt'), 'w', encoding='utf-8') as f:
    f.write('Alle Assets: Poly Haven (https://polyhaven.com), Lizenz CC0.\n\nTexturen: ' + ', '.join(TEXTURES) + '\nHDRIs: ' + ', '.join(HDRIS) + '\nModelle: ' + ', '.join(MODELS) + '\n')
