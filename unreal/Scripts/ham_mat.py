"""Material-Bibliothek für High Abyss Mira: Fotoscan-Materialien (weltbezogen projiziert) und
Materialien mit eingebauter Bewegung (World Position Offset) für Tiere, Regen, Laub und Flackerlicht."""
import os, unreal

AT = unreal.AssetToolsHelpers.get_asset_tools()
MEL = unreal.MaterialEditingLibrary
EAL = unreal.EditorAssetLibrary
HERE = os.path.dirname(os.path.abspath(__file__))
PH = os.path.join(HERE, 'polyhaven')
LOG = []
def log(*a):
    msg = 'HAM: ' + ' '.join(str(x) for x in a); LOG.append(msg); unreal.log(msg)

def import_file(src, dest, name=None):
    t = unreal.AssetImportTask(); t.filename = src; t.destination_path = dest; t.automated = True; t.replace_existing = True; t.save = True
    if name: t.destination_name = name
    AT.import_asset_tasks([t]); paths = list(t.imported_object_paths)
    if not paths: log('Import FEHLGESCHLAGEN', src)
    return paths

def texture_file(path, dest, name, kind='D'):
    asset = f'{dest}/{name}'
    if EAL.does_asset_exist(asset): return unreal.load_asset(asset)
    p = import_file(path, dest, name)
    if not p: return None
    tex = unreal.load_asset(p[0])
    if kind == 'N':
        tex.set_editor_property('compression_settings', unreal.TextureCompressionSettings.TC_NORMALMAP); tex.set_editor_property('srgb', False); tex.set_editor_property('flip_green_channel', True)
    elif kind in ('R', 'AO', 'H', 'M'):
        tex.set_editor_property('srgb', False); tex.set_editor_property('compression_settings', unreal.TextureCompressionSettings.TC_GRAYSCALE)
    EAL.save_loaded_asset(tex); return tex

def ph_texture(tid, short):
    folder = os.path.join(PH, 'textures', tid)
    if not os.path.isdir(folder): return None
    f = next((x for x in os.listdir(folder) if x.startswith(f'{tid}_{short}.')), None)
    return texture_file(os.path.join(folder, f), f'/Game/Textures/{tid}', f'T_{tid}_{short}', short) if f else None

FN_TEX = unreal.load_asset('/Engine/Functions/Engine_MaterialFunctions01/Texturing/WorldAlignedTexture')
FN_NRM = unreal.load_asset('/Engine/Functions/Engine_MaterialFunctions01/Texturing/WorldAlignedNormal')

def new_material(name, folder='/Game/Materials'):
    path = f'{folder}/{name}'
    if EAL.does_asset_exist(path): EAL.delete_asset(path)
    return AT.create_asset(name, folder, unreal.Material, unreal.MaterialFactoryNew())

def ex(m, cls, x=-500, y=0): return MEL.create_material_expression(m, cls, x, y)
def const(m, v, x=-500, y=0):
    if isinstance(v, (tuple, list)):
        c = ex(m, unreal.MaterialExpressionConstant3Vector, x, y); c.set_editor_property('constant', unreal.LinearColor(v[0], v[1], v[2], 1)); return c
    c = ex(m, unreal.MaterialExpressionConstant, x, y); c.set_editor_property('r', float(v)); return c
def mul(m, a, b, ao='', bo='', x=-250, y=0):
    n = ex(m, unreal.MaterialExpressionMultiply, x, y); MEL.connect_material_expressions(a, ao, n, 'A'); MEL.connect_material_expressions(b, bo, n, 'B'); return n
def out(m, node, prop, pin=''): MEL.connect_material_property(node, pin, prop)

def custom(m, code, inputs, out_type=unreal.CustomMaterialOutputType.CMOT_FLOAT3, x=-700, y=600, desc='Bewegung'):
    """HLSL-Knoten. inputs: Liste (Name, Knoten)."""
    c = ex(m, unreal.MaterialExpressionCustom, x, y)
    c.set_editor_property('code', code); c.set_editor_property('output_type', out_type); c.set_editor_property('description', desc)
    ins = []
    for n, _ in inputs:
        ci = unreal.CustomInput(); ci.set_editor_property('input_name', n); ins.append(ci)
    c.set_editor_property('inputs', ins)
    for n, node in inputs: MEL.connect_material_expressions(node, '', c, n)
    return c

def wpo_inputs(m, x=-1100, y=600):
    wp = ex(m, unreal.MaterialExpressionWorldPosition, x, y)
    try: wp.set_editor_property('world_position_shader_offset', unreal.WorldPositionIncludedOffsets.WPT_EXCLUDE_ALL_SHADER_OFFSETS)
    except Exception: pass
    pv = ex(m, unreal.MaterialExpressionObjectPositionWS, x, y + 120)
    t = ex(m, unreal.MaterialExpressionTime, x, y + 240)
    return [('WP', wp), ('PV', pv), ('T', t)]

def world_sample(m, tex, size_cm, y, normal=False):
    to = ex(m, unreal.MaterialExpressionTextureObject, -1100, y); to.set_editor_property('texture', tex)
    if normal: to.set_editor_property('sampler_type', unreal.MaterialSamplerType.SAMPLERTYPE_NORMAL)
    elif tex.get_editor_property('srgb') is False: to.set_editor_property('sampler_type', unreal.MaterialSamplerType.SAMPLERTYPE_LINEAR_GRAYSCALE if tex.get_editor_property('compression_settings') == unreal.TextureCompressionSettings.TC_GRAYSCALE else unreal.MaterialSamplerType.SAMPLERTYPE_LINEAR_COLOR)
    sz = const(m, (size_cm, size_cm, size_cm), -1100, y + 120)
    fc = ex(m, unreal.MaterialExpressionMaterialFunctionCall, -800, y); fc.set_material_function(FN_NRM if normal else FN_TEX)
    MEL.connect_material_expressions(to, '', fc, 'TextureObject'); MEL.connect_material_expressions(sz, '', fc, 'TextureSize')
    return fc

def scan_material(name, tid, size_cm, tint=(1, 1, 1), rough=1.0, wet=0.0, puddles=False):
    """Fotoscan-Material. wet dunkelt ab und macht glänzender, puddles fügt großflächige Pfützen hinzu."""
    m = new_material(name)
    d, n, r, ao = ph_texture(tid, 'D'), ph_texture(tid, 'N'), ph_texture(tid, 'R'), ph_texture(tid, 'AO')
    # Pfützen-Maske (großflächiges Rauschen)
    mask = None
    if puddles:
        nz = ex(m, unreal.MaterialExpressionNoise, -1100, 1100); nz.set_editor_property('scale', .0016); nz.set_editor_property('levels', 4)
        nz.set_editor_property('output_min', -1.4); nz.set_editor_property('output_max', 1.2)
        mask = ex(m, unreal.MaterialExpressionSaturate, -800, 1100); MEL.connect_material_expressions(nz, '', mask, '')
    if d:
        s = world_sample(m, d, size_cm, -500); col = mul(m, s, const(m, tint, -800, -350), 'XYZ Texture', '', -500, -500)
        if wet: col = mul(m, col, const(m, 1 - wet * .35, -500, -350), '', '', -300, -500)
        if mask:
            dark = mul(m, col, const(m, .45, -500, -250), '', '', -300, -380)
            lp = ex(m, unreal.MaterialExpressionLinearInterpolate, -150, -500); MEL.connect_material_expressions(col, '', lp, 'A'); MEL.connect_material_expressions(dark, '', lp, 'B'); MEL.connect_material_expressions(mask, '', lp, 'Alpha'); col = lp
        out(m, col, unreal.MaterialProperty.MP_BASE_COLOR)
    if n:
        s = world_sample(m, n, size_cm, 0, normal=True)
        if mask:  # Pfützen sind glatt: Normale Richtung (0,0,1)
            flat = const(m, (0, 0, 1), -500, 150)
            lp = ex(m, unreal.MaterialExpressionLinearInterpolate, -150, 0); MEL.connect_material_expressions(s, 'XYZ Texture', lp, 'A'); MEL.connect_material_expressions(flat, '', lp, 'B'); MEL.connect_material_expressions(mask, '', lp, 'Alpha')
            out(m, lp, unreal.MaterialProperty.MP_NORMAL)
        else: out(m, s, unreal.MaterialProperty.MP_NORMAL, 'XYZ Texture')
    if r:
        s = world_sample(m, r, size_cm, 500); rr = mul(m, s, const(m, rough * (1 - wet * .5), -800, 650), 'XYZ Texture', '', -500, 500)
        if mask:
            lp = ex(m, unreal.MaterialExpressionLinearInterpolate, -150, 500); MEL.connect_material_expressions(rr, '', lp, 'A'); MEL.connect_material_expressions(const(m, .03, -500, 650), '', lp, 'B'); MEL.connect_material_expressions(mask, '', lp, 'Alpha'); rr = lp
        out(m, rr, unreal.MaterialProperty.MP_ROUGHNESS)
    if ao: out(m, world_sample(m, ao, size_cm, 900), unreal.MaterialProperty.MP_AMBIENT_OCCLUSION, 'XYZ Texture')
    MEL.recompile_material(m); EAL.save_loaded_asset(m)
    log('Material', name, ''.join(k for k, v in (('D', d), ('N', n), ('R', r), ('A', ao)) if v), 'Pfützen' if puddles else '')
    return m

def plain(name, color, rough=.5, metal=0., emissive=None, strength=0., two_sided=False, unlit=False, opacity=None, masked_tex=None, wpo=None, emissive_tex=None):
    m = new_material(name)
    if two_sided: m.set_editor_property('two_sided', True)
    if unlit: m.set_editor_property('shading_model', unreal.MaterialShadingModel.MSM_UNLIT)
    if opacity is not None:
        m.set_editor_property('blend_mode', unreal.BlendMode.BLEND_TRANSLUCENT)
        try: m.set_editor_property('translucency_lighting_mode', unreal.TranslucencyLightingMode.TLM_SURFACE)
        except Exception: pass
    base = const(m, color, -500, -300)
    if masked_tex:
        m.set_editor_property('blend_mode', unreal.BlendMode.BLEND_MASKED)
        ts = ex(m, unreal.MaterialExpressionTextureSample, -800, -100); ts.set_editor_property('texture', masked_tex)
        base = mul(m, base, ts, '', 'RGB', -400, -300); out(m, ts, unreal.MaterialProperty.MP_OPACITY_MASK, 'A')
    if emissive_tex:
        ts = ex(m, unreal.MaterialExpressionTextureSample, -800, 200); ts.set_editor_property('texture', emissive_tex)
        out(m, mul(m, ts, const(m, strength, -800, 350), 'RGB', '', -400, 200), unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    if unlit: out(m, base if not emissive else const(m, [c * strength for c in emissive], -500, 0), unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    else:
        out(m, base, unreal.MaterialProperty.MP_BASE_COLOR)
        out(m, const(m, rough, -500, -150), unreal.MaterialProperty.MP_ROUGHNESS)
        out(m, const(m, metal, -500, -80), unreal.MaterialProperty.MP_METALLIC)
        if emissive and not emissive_tex: out(m, const(m, [c * strength for c in emissive], -500, 0), unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    if opacity is not None:
        if isinstance(opacity, (int, float)): out(m, const(m, opacity, -500, 100), unreal.MaterialProperty.MP_OPACITY)
        else: out(m, opacity(m), unreal.MaterialProperty.MP_OPACITY)
    if wpo: out(m, custom(m, wpo, wpo_inputs(m)), unreal.MaterialProperty.MP_WORLD_POSITION_OFFSET)
    MEL.recompile_material(m); EAL.save_loaded_asset(m); return m

# ---------------------------------------------------------------- Bewegung (HLSL, Einheiten: cm, Sekunden)
H = 'float hash(float n){return frac(sin(n)*43758.5453);}\n'
WPO_MOTHS = '''float3 d = WP - PV; float r = length(d.xy) + 0.001;
float s = frac(sin(floor(r / 4.0) * 91.7 + PV.x * 0.013) * 43758.5453);
float a = T * (1.4 + s * 2.8) * (s > 0.5 ? 1.0 : -1.0) + s * 6.2831;
float c = cos(a), sn = sin(a);
float2 q = float2(d.x * c - d.y * sn, d.x * sn + d.y * c);
float z = sin(T * 5.0 + s * 20.0) * 9.0 + sin(T * 1.3 + s * 7.0) * 18.0;
return float3(q - d.xy, z);'''
WPO_CROW_PERCH = '''float3 d = WP - PV; float head = step(4.5, d.z);
float k = floor(T * 1.6 + PV.x * 0.0037 + PV.y * 0.0021);
float a = (frac(sin(k * 12.9898 + PV.x * 0.1) * 43758.5453) - 0.5) * 2.4;
float bob = sin(T * 0.7 + PV.y * 0.01) * 0.4;
float c = cos(a), sn = sin(a);
float2 q = float2(d.x * c - d.y * sn, d.x * sn + d.y * c);
return float3((q - d.xy) * head, bob);'''
WPO_CROW_CIRCLE = '''float3 d = WP - PV; float ph = frac(PV.x * 0.00031 + PV.y * 0.00017) * 6.2831;
float w = abs(length(d.xy) - 1500.0); float flap = w > 6.0 ? sin(T * 7.0 + ph) * w * 0.55 : 0.0;
float3 p = float3(d.x, d.y, d.z + flap);
float a = T * 0.22 + ph; float c = cos(a), sn = sin(a);
float2 q = float2(p.x * c - p.y * sn, p.x * sn + p.y * c);
float h = sin(T * 0.31 + ph) * 250.0;
return float3(q.x, q.y, p.z + h) - d;'''
WPO_RAT_RUN = '''float3 d = WP - PV; float p = frac(T / 19.0 + frac(PV.x * 0.00113));
float m = step(p, 0.1); float x = (p / 0.1) * 1100.0;
return float3(x * m, sin(x * 0.05) * 6.0 * m, (1.0 - m) * -8000.0 + m * abs(sin(T * 38.0)) * 1.5);'''
WPO_RAT_SNIFF = '''float3 d = WP - PV; float head = saturate((d.x - 4.0) * 0.2);
float k = floor(T * 3.0 + PV.y * 0.01); float s = frac(sin(k * 7.13 + PV.x) * 43758.5);
return float3(0, sin(T * 23.0) * 0.4 * head, (sin(T * 17.0) * 0.5 + s * 1.2) * head);'''
WPO_RAIN = '''float3 d = WP - PV; float2 cell = floor(d.xy / 2.0);
float s = frac(sin(dot(cell, float2(12.9898, 78.233))) * 43758.5453);
float H = 1600.0; float z = frac(s - T * (0.62 + s * 0.12)) * H;
return float3(sin(T * 0.4) * 30.0 * (z / H), 0, z);'''
WPO_LEAVES = '''float3 d = WP - PV; float2 cell = floor(d.xy / 3.0);
float s = frac(sin(dot(cell, float2(39.3468, 11.135))) * 43758.5453);
float L = 2400.0; float x = frac(s + T * (0.018 + s * 0.02)) * L;
float gust = saturate(sin(T * 0.21 + s * 2.0) * 1.5);
return float3(x * gust + s * 30.0, sin(T * 2.3 + s * 40.0) * 25.0 * gust, abs(sin(T * 4.1 + s * 30.0)) * 22.0 * gust);'''
WPO_SPIDER = '''float3 d = WP - PV; float leg = step(1.4, length(d.xy));
float k = floor(T * 0.45 + PV.x * 0.01); float go = step(0.72, frac(sin(k * 3.7 + PV.y) * 43758.5));
float f = frac(T * 0.45 + PV.x * 0.01);
float dx = go * sin(f * 3.14159) * 14.0;
return float3(dx, 0, leg * sin(T * 30.0 + d.x) * 0.25 * (go + 0.15));'''
WPO_WEB = '''float3 d = WP - PV; float r = length(d);
return float3(0, 0, sin(T * 1.7 + PV.x * 0.01) * r * 0.025) + float3(sin(T * 1.1 + d.z * 0.05), cos(T * 0.9 + d.x * 0.05), 0) * r * 0.012;'''
WPO_FIGURE = '''float3 d = WP - PV; float up = saturate(d.z / 180.0);
float breath = sin(T * 1.1) * 0.6 * up;
float head = step(160.0, d.z);
float k = floor(T * 0.35 + PV.x * 0.001); float tilt = (frac(sin(k * 5.1) * 437.5) - 0.5) * 0.6;
return float3(breath + head * (d.z - 160.0) * tilt * 0.15, head * (d.z - 160.0) * tilt * 0.3, 0);'''
WPO_SWAY = '''float3 d = WP - PV; float h = saturate(d.z / 800.0); h *= h;
return float3(sin(T * 0.8 + PV.x * 0.01) * 22.0 * h + sin(T * 2.1 + PV.y * 0.02) * 6.0 * h, cos(T * 0.7 + PV.y * 0.01) * 14.0 * h, 0);'''
LF_FLICKER = '''float t = T * 9.0 + Seed * 17.0; float k = floor(t);
float n = frac(sin(k * 12.9898 + Seed) * 43758.5453);
float dead = step(0.88, n);
float hum = 0.9 + 0.1 * sin(T * 50.0 + Seed);
float burst = step(0.97, frac(sin(floor(T * 0.3 + Seed) * 7.7) * 437.58)) * step(0.5, frac(T * 13.0));
return max(0.02, hum * (1.0 - dead) * (1.0 - burst));'''
EM_BLINK = '''return Col * (step(0.5, frac(T * 0.5 + Seed)) * 0.9 + 0.1);'''

def light_function(name, seed):
    m = new_material(name); m.set_editor_property('material_domain', unreal.MaterialDomain.MD_LIGHT_FUNCTION)
    t = ex(m, unreal.MaterialExpressionTime, -900, 0); sd = const(m, seed, -900, 150)
    c = custom(m, LF_FLICKER, [('T', t), ('Seed', sd)], unreal.CustomMaterialOutputType.CMOT_FLOAT1, desc='Flackern')
    out(m, c, unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    MEL.recompile_material(m); EAL.save_loaded_asset(m); return m

def blinking(name, color, strength, seed):
    m = new_material(name); m.set_editor_property('shading_model', unreal.MaterialShadingModel.MSM_UNLIT)
    t = ex(m, unreal.MaterialExpressionTime, -900, 0); sd = const(m, seed, -900, 150); col = const(m, [c * strength for c in color], -900, 300)
    out(m, custom(m, EM_BLINK, [('T', t), ('Seed', sd), ('Col', col)], desc='Blinken'), unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    MEL.recompile_material(m); EAL.save_loaded_asset(m); return m

def add_wpo(mat, code):
    """WPO nachträglich an ein bestehendes Material (z. B. importiertes Baum-Material) hängen."""
    try:
        out(mat, custom(mat, code, wpo_inputs(mat)), unreal.MaterialProperty.MP_WORLD_POSITION_OFFSET)
        MEL.recompile_material(mat); EAL.save_loaded_asset(mat); return True
    except Exception as e:
        log('WPO nicht möglich', mat.get_name(), e); return False
